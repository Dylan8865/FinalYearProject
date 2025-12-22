import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAnswer, generateRelatedTopicsAI, generateEmbedding } from "@/lib/gemini";

// Types for search results
interface KnowledgeEntry {
  id: string;
  content: string | {
    url?: string;
    title?: string;
    description?: string;
    rows?: any[][];
    [key: string]: any;
  } | null;
  type: string;
  validity: number;
  created_at: string;
  order_index: number;
}

interface CachedAnswer {
  id: string;
  input_text: string;
  result_text: string;
  count: number;
  created_at: string;
}

interface SearchResult {
  id: string;
  content: string;
  source: string;
  validityScore: number;
  recencyScore: number;
  relevanceScore: number;
  totalScore: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  answer: string;
  results: SearchResult[];
  hasResults: boolean;
  suggestions?: string[];
  relatedTopics?: string[];
  error?: string;
  historyId?: string;
  usedEntries?: string[]; // Track which entries contributed to the answer
}

// Calculate recency score (0-100) based on created_at
function calculateRecencyScore(createdAt: string): number {
  const now = new Date();
  const created = new Date(createdAt);
  const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  
  // Score decreases as content gets older (max 365 days consideration)
  if (daysDiff <= 7) return 100;
  if (daysDiff <= 30) return 90;
  if (daysDiff <= 90) return 75;
  if (daysDiff <= 180) return 60;
  if (daysDiff <= 365) return 40;
  return 20;
}

// Calculate engagement score (0-100) based on user feedback
function calculateEngagementScore(
  positiveCount: number,
  negativeCount: number
): number {
  const totalFeedback = positiveCount + negativeCount;
  
  // If no feedback, return neutral score
  if (totalFeedback === 0) return 50;
  
  // Calculate percentage of positive feedback
  const positiveRate = positiveCount / totalFeedback;
  
  // Convert to 0-100 score with some dampening for low feedback counts
  // Items with more feedback are more reliable
  const confidenceFactor = Math.min(totalFeedback / 10, 1); // Full confidence at 10+ feedback
  const baseScore = positiveRate * 100;
  
  // Blend with neutral score based on confidence
  return Math.round(baseScore * confidenceFactor + 50 * (1 - confidenceFactor));
}

// Calculate total score using ranking algorithm C1
function calculateTotalScore(
  relevanceScore: number,
  validityScore: number,
  recencyScore: number,
  engagementScore: number
): number {
  // C1: Relevance Score = (AI Similarity × 0.4) + (Validity × 0.3) + (Recency × 0.2) + (Engagement × 0.1)
  return (
    relevanceScore * 0.4 +
    validityScore * 0.3 +
    recencyScore * 0.2 +
    engagementScore * 0.1
  );
}

// Simple keyword matching for relevance (replace with AI embeddings later)
function calculateRelevanceScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const contentLower = content.toLowerCase();
  
  if (queryWords.length === 0) return 0;
  
  let matchCount = 0;
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      matchCount++;
    }
  }
  
  return Math.round((matchCount / queryWords.length) * 100);
}

// Generate conversational response from results
function generateResponse(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  const topResults = results.slice(0, 3);
  
  let response = `Based on the knowledge in our repository, here's what I found for "${query}":\n\n`;
  
  topResults.forEach((result, index) => {
    response += `**${index + 1}. ${result.source}**\n`;
    response += `${result.content.slice(0, 300)}${result.content.length > 300 ? "..." : ""}\n`;
    response += `_Validity: ${result.validityScore}%_\n\n`;
  });

  if (results.length > 3) {
    response += `\n_Found ${results.length - 3} more related entries._\n`;
  }

  response += "\nWould you like me to elaborate on any of these findings?";

  return response;
}

// Generate suggestions for no results
function generateSuggestions(query: string): string[] {
  return [
    "Try using different keywords",
    "Use broader search terms",
    "Check for spelling errors",
    "Browse the Explore section for related topics",
  ];
}

// Generate related topics from search results
function generateRelatedTopics(query: string, results: SearchResult[]): string[] {
  const topics = new Set<string>();
  
  // Extract potential topics from results
  results.forEach((result) => {
    // Extract words from content that could be topics (simple approach)
    const words = result.content
      .split(/\s+/)
      .filter((word) => word.length > 4 && !query.toLowerCase().includes(word.toLowerCase()))
      .slice(0, 5);
    words.forEach((word) => topics.add(word.replace(/[^a-zA-Z]/g, "")));
  });

  // Return top 5 unique topics
  const topicsArray = Array.from(topics)
    .filter((t) => t.length > 3)
    .slice(0, 5);

  // If we don't have enough from results, add some generic related suggestions
  if (topicsArray.length < 3) {
    const genericTopics = [
      `More about ${query}`,
      "Related concepts",
      "Advanced topics",
    ];
    genericTopics.forEach((t) => {
      if (topicsArray.length < 5) topicsArray.push(t);
    });
  }

  return topicsArray;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json<SearchResponse>({
      success: false,
      query: "",
      answer: "",
      results: [],
      hasResults: false,
      error: "Please enter a search query to begin.",
    });
  }

  return handleSearch(query);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, chatId, userId, promptOrder } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json<SearchResponse>({
        success: false,
        query: "",
        answer: "",
        results: [],
        hasResults: false,
        error: "Please enter a search query to begin.",
      });
    }

    return handleSearch(query.trim(), chatId, userId, promptOrder);
  } catch {
    return NextResponse.json<SearchResponse>({
      success: false,
      query: "",
      answer: "",
      results: [],
      hasResults: false,
      error: "Invalid request format.",
    });
  }
}

// Helper function to save search history and track which entries were used
async function saveSearchHistory(
  supabase: any,
  query: string,
  answer: string,
  chatId?: string,
  userId?: string,
  promptOrder?: number,
  usedEntryIds?: string[]
): Promise<string | null> {
  console.log("Attempting to save search history:", { chatId, userId, hasAnswer: !!answer, usedEntries: usedEntryIds?.length });
  
  if (!chatId || !userId) {
    console.log("Skipping search history save - missing chatId or userId:", { chatId, userId });
    return null;
  }

  try {
    // First, ensure chat exists
    const { data: existingChat, error: chatFetchError } = await supabase
      .from("chat")
      .select("id")
      .eq("id", chatId)
      .single();

    if (chatFetchError && chatFetchError.code !== 'PGRST116') {
      console.error("Error checking existing chat:", chatFetchError);
    }

    if (!existingChat) {
      // Create chat if it doesn't exist
      console.log("Creating new chat:", chatId);
      const { error: chatInsertError } = await supabase.from("chat").insert({
        id: chatId,
        title: query.slice(0, 50),
        profile_id: userId,
      });
      
      if (chatInsertError) {
        console.error("Error creating chat:", chatInsertError);
      } else {
        console.log("Chat created successfully");
      }
    }

    // Save search history
    console.log("Inserting search history:", { chatId, promptOrder });
    const { data: historyData, error: historyError } = await supabase
      .from("search-history")
      .insert({
        prompt_text: query,
        result_text: answer,
        prompt_order: promptOrder || 0,
        chat_id: chatId,
        used_entry_ids: usedEntryIds || [], // Store as JSON array in search-history
      })
      .select("id")
      .single();
    
    if (historyError) {
      console.error("Error saving search history:", historyError);
      return null;
    }
    
    const historyId = historyData?.id || null;
    console.log("Search history saved successfully with entry mappings:", historyData);
    
    return historyId;
  } catch (error) {
    console.error("Failed to save search history (caught exception):", error);
    return null;
  }
}

// Normalize query for better cache matching
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    // Only remove question marks at the end
    .replace(/[?!.]+$/, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to cache answers
async function cacheAnswer(supabase: any, query: string, answer: string) {
  try {
    const normalizedQuery = normalizeQuery(query);
    console.log(`[CACHE] Normalized "${query}" → "${normalizedQuery}"`);
    
    // Generate embedding for semantic search
    const embedding = await generateEmbedding(query);
    
    const { data: existing, error: checkError } = await supabase
      .from("analysis-cache")
      .select("id, count, input_text")
      .eq("input_hash", normalizedQuery)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Cache check error:", checkError);
    }

    if (existing) {
      const updateData: any = {
        result_text: answer,
        count: existing.count + 1,
        input_text: query
      };
      
      // Add embedding if available
      if (embedding) {
        updateData.embeddings = embedding;
      }
      
      const { error: updateError } = await supabase
        .from("analysis-cache")
        .update(updateData)
        .eq("id", existing.id);
      
      if (updateError) {
        console.error("Cache update error:", updateError);
      } else {
        console.log(`[CACHE] Updated cache for: "${normalizedQuery}" (count: ${existing.count + 1})`);
      }
    } else {
      const insertData: any = {
        input_text: query,
        input_hash: normalizedQuery,
        result_text: answer,
        count: 1,
      };
      
      // Add embedding if available
      if (embedding) {
        insertData.embeddings = embedding;
      }
      
      const { error: insertError } = await supabase
        .from("analysis-cache")
        .insert(insertData);
      
      if (insertError) {
        console.error("Cache insert error:", insertError);
      } else {
        console.log(`[CACHE] Cached new query: "${normalizedQuery}" ${embedding ? '(with embedding)' : ''}`);
      }
    }
  } catch (error) {
    console.error("Failed to cache answer:", error);
  }
}


async function handleSearch(
  query: string,
  chatId?: string,
  userId?: string,
  promptOrder: number = 1
) {
  try {
    const supabase = await createClient();
    
    // Step 1: Check analysis-cache using semantic search (has embeddings)
    const normalizedQuery = normalizeQuery(query);
    
    // Try semantic search in cache first
    const queryEmbedding = await generateEmbedding(query);
    let cachedAnswers = null;
    
    if (queryEmbedding) {
      // Use vector similarity search on cache with very strict threshold
      const { data: semanticMatches } = await supabase.rpc('match_cache_queries', {
        query_embedding: queryEmbedding,
        match_threshold: 0.95, // 95% similarity - almost exact match required
        match_count: 1
      });
      
      if (semanticMatches && semanticMatches.length > 0) {
        cachedAnswers = [semanticMatches[0]];
        console.log(`[CACHE] Semantic cache hit: "${semanticMatches[0].input_text}" (similarity: ${semanticMatches[0].similarity.toFixed(3)})`);
      }
    }
    
    // Fallback to exact text match if no semantic match
    if (!cachedAnswers) {
      const { data } = await supabase
        .from("analysis-cache")
        .select("id, input_text, result_text, count, created_at")
        .eq("input_hash", normalizedQuery)
        .limit(1);
      cachedAnswers = data;
      if (cachedAnswers && cachedAnswers.length > 0) {
        console.log(`[CACHE] Exact text cache hit: "${normalizedQuery}"`);
      }
    }

    // If we have a cached answer, use it
    if (cachedAnswers && cachedAnswers.length > 0) {
      const cached = cachedAnswers[0];
      
      // Increment count
      await supabase
        .from("analysis-cache")
        .update({ count: cached.count + 1 })
        .eq("id", cached.id);

      const relatedTopics = await generateRelatedTopicsAI(query);
      
      // Save search history for cached answer
      const historyId = await saveSearchHistory(supabase, query, cached.result_text, chatId, userId, promptOrder);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer: cached.result_text,
        results: [],
        hasResults: true,
        relatedTopics: relatedTopics.length > 0 ? relatedTopics : undefined,
        historyId: historyId || undefined,
      });
    }

    // Step 2: Search in item-data table for actual knowledge
    console.log('[DEBUG] Searching item-data for query:', query);
    const { data: entries, error } = await supabase
      .from("item-data")
      .select("id, content, created_at, type, validity, order_index")
      .gte("validity", 60)
      .order("order_index", { ascending: true })
      .limit(100);

    console.log('[DEBUG] Database response:', { 
      entriesCount: entries?.length || 0, 
      hasError: !!error,
      errorMessage: error?.message 
    });

    if (error) {
      console.error("Supabase search error:", error);
      // Even if DB fails, try to answer with AI
      const aiAnswer = await generateAnswer({ query });
      const aiTopics = await generateRelatedTopicsAI(query);
      const answer = aiAnswer || "I encountered an issue searching the knowledge base, but I can still help. " + 
        "Could you please rephrase your question or try again?";
      
      // Cache the answer
      await cacheAnswer(supabase, query, answer);
      
      // Save search history even on DB error
      const historyId = await saveSearchHistory(supabase, query, answer, chatId, userId, promptOrder);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer,
        results: [],
        hasResults: false,
        relatedTopics: aiTopics.length > 0 ? aiTopics : undefined,
        suggestions: generateSuggestions(query),
        historyId: historyId || undefined,
      });
    }

    if (!entries || entries.length === 0) {
      // No results found - Use AI to generate a helpful response anyway
      const aiAnswer = await generateAnswer({ query });
      const aiTopics = await generateRelatedTopicsAI(query);
      const answer = aiAnswer || "I couldn't find any knowledge matching your query in our repository. However, I can try to help based on general knowledge.";
      
      // Cache the answer (especially important for queries with no DB data)
      await cacheAnswer(supabase, query, answer);
      
      // Save search history for no results
      const historyId = await saveSearchHistory(supabase, query, answer, chatId, userId, promptOrder);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer,
        results: [],
        hasResults: false,
        relatedTopics: aiTopics.length > 0 ? aiTopics : undefined,
        suggestions: generateSuggestions(query),
        historyId: historyId || undefined,
      });
    }

    // Calculate feedback counts ON-THE-FLY from existing feedback table
    // No new tables, no changes to item-data!
    const entryIds = entries.map(e => e.id);
    
    // Query all search histories that used these entries
    const { data: historiesWithEntries } = await supabase
      .from("search-history")
      .select("id, used_entry_ids")
      .not("used_entry_ids", "is", null);
    
    // Build a map of which search histories used which entries
    const entryToHistoryMap = new Map<string, string[]>();
    historiesWithEntries?.forEach((history: any) => {
      const usedIds = history.used_entry_ids || [];
      usedIds.forEach((entryId: string) => {
        if (!entryToHistoryMap.has(entryId)) {
          entryToHistoryMap.set(entryId, []);
        }
        entryToHistoryMap.get(entryId)!.push(history.id);
      });
    });
    
    // Get feedback for all relevant search histories
    const allHistoryIds = Array.from(new Set(
      Array.from(entryToHistoryMap.values()).flat()
    ));
    
    const { data: allFeedback } = allHistoryIds.length > 0 ? await supabase
      .from("feedback")
      .select("message_id, feedback_type")
      .in("message_id", allHistoryIds)
      : { data: [] };
    
    // Count feedback per entry
    const feedbackMap = new Map<string, { positive: number; negative: number }>();
    entryIds.forEach(entryId => {
      const historyIds = entryToHistoryMap.get(entryId) || [];
      const feedbackForEntry = allFeedback?.filter((f: any) => 
        historyIds.includes(f.message_id)
      ) || [];
      
      const positive = feedbackForEntry.filter((f: any) => f.feedback_type === "positive").length;
      const negative = feedbackForEntry.filter((f: any) => f.feedback_type === "negative").length;
      
      feedbackMap.set(entryId, { positive, negative });
    });

    // Process and rank results
    const searchResults: SearchResult[] = entries
      .map((entry: KnowledgeEntry) => {
        // Handle different content structures based on block type
        let title = "";
        let description = "";
        let searchableText = "";
        
        if (typeof entry.content === "string") {
          // Simple text content (headings, paragraphs, quotes, lists, code, etc.)
          // Content might be JSON-encoded string, so try to parse it
          try {
            const parsed = JSON.parse(entry.content);
            if (typeof parsed === "string") {
              searchableText = parsed;
              description = parsed;
            } else {
              searchableText = entry.content;
              description = entry.content;
            }
          } catch {
            // Not JSON, use as-is
            searchableText = entry.content;
            description = entry.content;
          }
          title = entry.type || "Content";
        } else if (entry.content && typeof entry.content === "object") {
          // Object content (could be bookmark, table, or other structured data)
          if (entry.content.title && entry.content.description) {
            // Bookmark format: { title, description, url }
            title = entry.content.title || "";
            description = entry.content.description || "";
            searchableText = `${title} ${description} ${entry.content.url || ""}`;
          } else if (entry.content.rows && Array.isArray(entry.content.rows)) {
            // Table format: { rows: [...] }
            const tableText = entry.content.rows
              .flat()
              .filter((cell: any) => cell)
              .join(" ");
            searchableText = tableText;
            description = tableText;
            title = "Table";
          } else {
            // Other object formats - try to extract text
            searchableText = JSON.stringify(entry.content);
            description = searchableText;
            title = entry.type || "Content";
          }
        } else {
          // Empty or null content (dividers, empty blocks)
          return null;
        }
        
        // Calculate relevance score with keyword matching
        const searchTextLower = searchableText.toLowerCase();
        const queryLower = query.toLowerCase().trim();
        const queryWords = queryLower.split(/[\s:,.-]+/).filter(w => w.length > 2);
        
        // Extract main keywords and technical terms
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'common', 'how', 'what', 'when', 'where', 'why'];
        const keywords = queryWords.filter(w => !stopWords.includes(w));
        
        // Identify specific technical terms (uppercase abbreviations, "ratings", "types", etc.)
        const technicalTerms = keywords.filter(w => 
          w === w.toUpperCase() || // AFUE, SEER, BTU
          ['rating', 'ratings', 'efficiency', 'types', 'models', 'brands'].some(t => w.includes(t))
        );
        
        // Check if query matches
        let matchScore = 0;
        if (searchTextLower.includes(queryLower)) {
          matchScore = 100; // Exact phrase match
        } else if (technicalTerms.length > 0) {
          // If query has technical terms, REQUIRE at least one to be in content
          const matchingTechnical = technicalTerms.filter(term => searchTextLower.includes(term.toLowerCase()));
          if (matchingTechnical.length > 0) {
            // Technical term found, check other keywords too
            const matchingKeywords = keywords.filter(word => searchTextLower.includes(word));
            matchScore = (matchingKeywords.length / keywords.length) * 100;
          } else {
            // No technical terms matched - this content is not relevant
            matchScore = 0;
          }
        } else if (keywords.length > 0) {
          // No technical terms, just check keyword overlap
          const matchingKeywords = keywords.filter(word => searchTextLower.includes(word));
          if (matchingKeywords.length > 0) {
            matchScore = (matchingKeywords.length / keywords.length) * 100;
          }
        }
        
        // Require at least 10% match
        if (matchScore < 10) {
          return null;
        }
        
        const content = description;
        const relevanceScore = matchScore;
        const validityScore = entry.validity || 0; // Use numeric validity (0-100)
        const recencyScore = calculateRecencyScore(entry.created_at);
        
        // Get engagement score from feedback data
        const feedback = feedbackMap.get(entry.id) || { positive: 0, negative: 0 };
        const engagementScore = calculateEngagementScore(feedback.positive, feedback.negative);
        
        const totalScore = calculateTotalScore(relevanceScore, validityScore, recencyScore, engagementScore);

        return {
          id: entry.id,
          content,
          source: title || "Knowledge Entry",
          validityScore,
          recencyScore,
          relevanceScore,
          totalScore,
        };
      })
      .filter((result): result is SearchResult => result !== null)
      // Results are already filtered by validity >= 60 in the database query
      // Sort by total score descending
      .sort((a: SearchResult, b: SearchResult) => b.totalScore - a.totalScore);

    if (searchResults.length === 0) {
      // No validated results - Use AI to generate response
      const aiAnswer = await generateAnswer({ query });
      const aiTopics = await generateRelatedTopicsAI(query);
      const answer = aiAnswer || "I couldn't find any validated knowledge matching your query.";
      
      // Cache the answer
      await cacheAnswer(supabase, query, answer);
      
      // Save search history for no validated results
      const historyId = await saveSearchHistory(supabase, query, answer, chatId, userId, promptOrder);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer,
        results: [],
        hasResults: false,
        relatedTopics: aiTopics.length > 0 ? aiTopics : undefined,
        suggestions: generateSuggestions(query),
        historyId: historyId || undefined,
      });
    }

    // Build context from search results for AI (without source labels)
    const context = searchResults.slice(0, 5).map(r => 
      `${r.source}\n${r.content.slice(0, 500)}`
    ).join("\n\n");
    
    // Track which entry IDs were used
    const usedEntryIds = searchResults.slice(0, 5).map(r => r.id);

    // Generate AI-powered conversational response using the search results as context
    const aiAnswer = await generateAnswer({ query, context });
    
    // Use AI answer if available, otherwise fall back to simple response
    const answer = aiAnswer || generateResponse(query, searchResults);

    // Generate related topics using AI
    const aiTopics = await generateRelatedTopicsAI(query, context);
    const relatedTopics = aiTopics.length > 0 ? aiTopics : generateRelatedTopics(query, searchResults);

    // Cache the answer for future queries
    await cacheAnswer(supabase, query, answer);

    // Save search history for successful search with entry mapping
    const historyId = await saveSearchHistory(supabase, query, answer, chatId, userId, promptOrder, usedEntryIds);

    return NextResponse.json<SearchResponse>({
      success: true,
      query,
      answer,
      results: searchResults,
      hasResults: true,
      relatedTopics,
      historyId: historyId || undefined,
      usedEntries: usedEntryIds,
    });
  } catch (error) {
    console.error("Search error:", error);
    
    // Try AI as fallback even on error
    try {
      const supabase = await createClient();
      const aiAnswer = await generateAnswer({ query });
      if (aiAnswer) {
        // Cache the error fallback answer
        await cacheAnswer(supabase, query, aiAnswer);
        
        // Save search history for error fallback
        const historyId = await saveSearchHistory(supabase, query, aiAnswer, chatId, userId, promptOrder);
        
        return NextResponse.json<SearchResponse>({
          success: true,
          query,
          answer: aiAnswer,
          results: [],
          hasResults: false,
          suggestions: generateSuggestions(query),
          historyId: historyId || undefined,
        });
      }
    } catch {
      // Ignore AI fallback error
    }
    
    return NextResponse.json<SearchResponse>({
      success: false,
      query,
      answer: "",
      results: [],
      hasResults: false,
      error: "An unexpected error occurred. Please try again.",
    });
  }
}
