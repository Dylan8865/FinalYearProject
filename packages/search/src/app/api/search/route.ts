import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAnswer, generateRelatedTopicsAI } from "@/lib/gemini";

// Types for search results
interface KnowledgeEntry {
  id: string;
  content: {
    url?: string;
    title?: string;
    description?: string;
  };
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

// Calculate total score using ranking algorithm C1
function calculateTotalScore(
  relevanceScore: number,
  validityScore: number,
  recencyScore: number,
  engagementScore: number = 50 // Default engagement score
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

// Helper function to save search history
async function saveSearchHistory(
  supabase: any,
  query: string,
  answer: string,
  chatId?: string,
  userId?: string,
  promptOrder?: number
) {
  console.log("Attempting to save search history:", { chatId, userId, hasAnswer: !!answer });
  
  if (!chatId || !userId) {
    console.log("Skipping search history save - missing chatId or userId:", { chatId, userId });
    return;
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
    const { data: historyData, error: historyError } = await supabase.from("search-history").insert({
      prompt_text: query,
      result_text: answer,
      prompt_order: promptOrder || 0,
      chat_id: chatId,
    });
    
    if (historyError) {
      console.error("Error saving search history:", historyError);
    } else {
      console.log("Search history saved successfully:", historyData);
    }
  } catch (error) {
    console.error("Failed to save search history (caught exception):", error);
  }
}

async function handleSearch(
  query: string,
  chatId?: string,
  userId?: string,
  promptOrder?: number
): Promise<NextResponse<SearchResponse>> {
  try {
    const supabase = await createClient();

    // Step 1: Check analysis-cache for similar queries (cached answers)
    const { data: cachedAnswers } = await supabase
      .from("analysis-cache")
      .select("id, input_text, result_text, count, created_at")
      .ilike("input_text", `%${query}%`)
      .order("count", { ascending: false })
      .limit(1);

    // If we have a cached answer with high confidence, use it
    if (cachedAnswers && cachedAnswers.length > 0 && cachedAnswers[0].count > 2) {
      const cached = cachedAnswers[0];
      
      // Increment count (Fibonacci-based update logic can be added here)
      await supabase
        .from("analysis-cache")
        .update({ count: cached.count + 1 })
        .eq("id", cached.id);

      const relatedTopics = await generateRelatedTopicsAI(query);
      
      // Save search history for cached answer
      await saveSearchHistory(supabase, query, cached.result_text, chatId, userId, promptOrder);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer: cached.result_text,
        results: [],
        hasResults: true,
        relatedTopics: relatedTopics.length > 0 ? relatedTopics : undefined,
      });
    }

    // Step 2: Search in item-data table for actual knowledge
    const { data: entries, error } = await supabase
      .from("item-data")
      .select("id, content, created_at, type, validity, order_index")
      .gte("validity", 60)
      .order("order_index", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Supabase search error:", error);
      // Even if DB fails, try to answer with AI
      const aiAnswer = await generateAnswer({ query });
      const aiTopics = await generateRelatedTopicsAI(query);
      const answer = aiAnswer || "I encountered an issue searching the knowledge base, but I can still help. " + 
        "Could you please rephrase your question or try again?";
      
      // Save search history even on DB error
      await saveSearchHistory(supabase, query, answer, chatId, userId, promptOrder);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer,
        results: [],
        hasResults: false,
        relatedTopics: aiTopics.length > 0 ? aiTopics : undefined,
        suggestions: generateSuggestions(query),
      });
    }

    if (!entries || entries.length === 0) {
      // No results found - Use AI to generate a helpful response anyway
      const aiAnswer = await generateAnswer({ query });
      const aiTopics = await generateRelatedTopicsAI(query);
      const answer = aiAnswer || "I couldn't find any knowledge matching your query in our repository. However, I can try to help based on general knowledge.";
      
      // Save search history for no results
      await saveSearchHistory(supabase, query, answer, chatId, userId, promptOrder);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer,
        results: [],
        hasResults: false,
        relatedTopics: aiTopics.length > 0 ? aiTopics : undefined,
        suggestions: generateSuggestions(query),
      });
    }

    // Process and rank results
    const searchResults: SearchResult[] = entries
      .map((entry: KnowledgeEntry) => {
        const title = entry.content?.title || "";
        const description = entry.content?.description || "";
        const url = entry.content?.url || "";
        const searchText = `${title} ${description} ${url}`.toLowerCase();
        
        // Calculate relevance score with keyword matching
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/[\s:,.-]+/).filter(w => w.length > 2);
        
        // Check if query matches (full phrase or significant word overlap)
        let matchScore = 0;
        if (searchText.includes(queryLower)) {
          matchScore = 100; // Exact phrase match
        } else {
          // Count matching words
          const matchingWords = queryWords.filter(word => searchText.includes(word));
          matchScore = queryWords.length > 0 ? (matchingWords.length / queryWords.length) * 100 : 0;
        }
        
        // Skip entries with very low relevance
        if (matchScore < 20) {
          return null;
        }
        
        const content = description || title;
        const relevanceScore = matchScore;
        const validityScore = entry.validity || 0; // Use numeric validity (0-100)
        const recencyScore = calculateRecencyScore(entry.created_at);
        const totalScore = calculateTotalScore(relevanceScore, validityScore, recencyScore);

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
      
      // Save search history for no validated results
      await saveSearchHistory(supabase, query, answer, chatId, userId, promptOrder);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer,
        results: [],
        hasResults: false,
        relatedTopics: aiTopics.length > 0 ? aiTopics : undefined,
        suggestions: generateSuggestions(query),
      });
    }

    // Build context from search results for AI
    const context = searchResults.slice(0, 5).map((r, i) => 
      `Source ${i + 1}: ${r.source}\nContent: ${r.content.slice(0, 500)}`
    ).join("\n\n");

    // Generate AI-powered conversational response using the search results as context
    const aiAnswer = await generateAnswer({ query, context });
    
    // Use AI answer if available, otherwise fall back to simple response
    const answer = aiAnswer || generateResponse(query, searchResults);

    // Generate related topics using AI
    const aiTopics = await generateRelatedTopicsAI(query, context);
    const relatedTopics = aiTopics.length > 0 ? aiTopics : generateRelatedTopics(query, searchResults);

    // Cache the answer in analysis-cache for future similar queries
    try {
      await supabase
        .from("analysis-cache")
        .insert({
          input_text: query,
          result_text: answer,
          count: 1,
        });
    } catch {
      // Ignore cache errors, don't fail the request
    }

    // Save search history for successful search
    await saveSearchHistory(supabase, query, answer, chatId, userId, promptOrder);

    return NextResponse.json<SearchResponse>({
      success: true,
      query,
      answer,
      results: searchResults,
      hasResults: true,
      relatedTopics,
    });
  } catch (error) {
    console.error("Search error:", error);
    
    // Try AI as fallback even on error
    try {
      const supabase = await createClient();
      const aiAnswer = await generateAnswer({ query });
      if (aiAnswer) {
        // Save search history for error fallback
        await saveSearchHistory(supabase, query, aiAnswer, chatId, userId, promptOrder);
        
        return NextResponse.json<SearchResponse>({
          success: true,
          query,
          answer: aiAnswer,
          results: [],
          hasResults: false,
          suggestions: generateSuggestions(query),
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
