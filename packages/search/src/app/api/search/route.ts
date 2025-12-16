import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAnswer, generateRelatedTopicsAI } from "@/lib/gemini";

// Types for search results
interface KnowledgeEntry {
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
    "Browse the Knowledge Repository",
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
    const { query } = body;

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

    return handleSearch(query.trim());
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

async function handleSearch(query: string): Promise<NextResponse<SearchResponse>> {
  try {
    const supabase = await createClient();

    // Search in analysis-cache table
    // Using text search on input_text and result_text columns
    const { data: entries, error } = await supabase
      .from("analysis-cache")
      .select("id, input_text, result_text, count, created_at")
      .or(`input_text.ilike.%${query}%,result_text.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error("Supabase search error:", error);
      // Even if DB fails, try to answer with AI
      const aiAnswer = await generateAnswer({ query });
      const aiTopics = await generateRelatedTopicsAI(query);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer: aiAnswer || "I encountered an issue searching the knowledge base, but I can still help. " + 
          "Could you please rephrase your question or try again?",
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
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer: aiAnswer || "I couldn't find any knowledge matching your query in our repository. However, I can try to help based on general knowledge.",
        results: [],
        hasResults: false,
        relatedTopics: aiTopics.length > 0 ? aiTopics : undefined,
        suggestions: generateSuggestions(query),
      });
    }

    // Process and rank results
    const searchResults: SearchResult[] = entries
      .map((entry: KnowledgeEntry) => {
        const content = entry.result_text || entry.input_text || "";
        const relevanceScore = calculateRelevanceScore(query, content);
        const validityScore = 70; // Default validity score (can be enhanced with actual data)
        const recencyScore = calculateRecencyScore(entry.created_at);
        const totalScore = calculateTotalScore(relevanceScore, validityScore, recencyScore);

        return {
          id: entry.id,
          content,
          source: entry.input_text?.slice(0, 50) || "Knowledge Entry",
          validityScore,
          recencyScore,
          relevanceScore,
          totalScore,
        };
      })
      // Filter by minimum validity (60%)
      .filter((result: SearchResult) => result.validityScore >= 60)
      // Sort by total score descending
      .sort((a: SearchResult, b: SearchResult) => b.totalScore - a.totalScore);

    if (searchResults.length === 0) {
      // No validated results - Use AI to generate response
      const aiAnswer = await generateAnswer({ query });
      const aiTopics = await generateRelatedTopicsAI(query);
      
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        answer: aiAnswer || "I couldn't find any validated knowledge matching your query.",
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
      const aiAnswer = await generateAnswer({ query });
      if (aiAnswer) {
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
