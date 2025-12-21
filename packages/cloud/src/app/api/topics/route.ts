import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * item-data table schema (EXACT structure):
 * - id: uuid (PRIMARY KEY)
 * - created_at: timestamptz
 * - type: text
 * - content: jsonb (the actual content data: {url, title, description})
 * - island_item_id: uuid (FOREIGN KEY to island-item, nullable)
 * - valid: boolean
 * - order_index: integer
 * - parent_id: uuid (FOREIGN KEY to item-data, self-reference, nullable)
 * - properties: jsonb (default '{}')
 */

/**
 * Extract text from jsonb content field
 * Based on your item-data structure: {url, title, description}
 */
function extractTextFromJsonb(content: unknown): string {
  if (!content) return "";
  
  // If it's already a string
  if (typeof content === "string") return content;
  
  // If it's an object, extract and combine all text fields
  if (typeof content === "object") {
    const obj = content as Record<string, unknown>;
    
    // Combine title and description (primary fields in your data)
    const parts: string[] = [];
    
    if (obj.title) parts.push(String(obj.title));
    if (obj.description) parts.push(String(obj.description));
    
    // Also check other common fields if they exist
    if (obj.text) parts.push(String(obj.text));
    if (obj.body) parts.push(String(obj.body));
    if (obj.value) parts.push(String(obj.value));
    
    if (parts.length > 0) {
      return parts.join(" ");
    }
    
    // Fallback: stringify entire content
    return JSON.stringify(content);
  }
  
  return String(content);
}

/**
 * Call Gemini AI API
 */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Extract topic from content using AI
 */
async function extractTopicFromContent(type: string, content: string): Promise<{
  topic: string;
  weight: number;
  category: string;
}> {
  const prompt = `Analyze this educational content and extract the MAIN TOPIC.

Type: ${type}
Content: ${content.slice(0, 1500)}

Return ONLY valid JSON:
{
  "topic": "Main Topic (2-4 words)",
  "weight": 50,
  "category": "Science|Technology|Mathematics|History|Language|Arts|Geography|Health|Other"
}

Weight should be 30-100 based on content quality/depth.
Return ONLY JSON, no markdown.`;

  try {
    const result = await callGemini(prompt);
    let cleanResult = result.trim();
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.split("```")[1];
      if (cleanResult.startsWith("json")) {
        cleanResult = cleanResult.slice(4);
      }
    }
    return JSON.parse(cleanResult);
  } catch {
    // Fallback: use type as topic
    return {
      topic: type || "Unknown",
      weight: 50,
      category: "Other",
    };
  }
}

/**
 * GET /api/topics
 * Fetch topics from cache (cloud-topics-cache table) with fallback to real-time AI extraction
 * 
 * Data flow:
 * 1. Try to read from cloud-topics-cache (fast)
 * 2. If cache empty, fall back to real-time AI extraction (slow)
 * 3. Real-time extraction can cache results for next time
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Smart cache check: Compare item-data count vs cached count
    const [itemCountResult, cacheCountResult] = await Promise.all([
      supabase
        .from("item-data")
        .select("id", { count: "exact", head: true })
        .gte("validity", 60),
      supabase
        .from("cloud-topics-cache")
        .select("id", { count: "exact", head: true })
    ]);

    const itemCount = itemCountResult.count || 0;
    const cacheCount = cacheCountResult.count || 0;

    console.log(`📊 Smart check: ${itemCount} items vs ${cacheCount} cached`);

    // If there are new items, process them
    if (itemCount > cacheCount) {
      const newItemsCount = itemCount - cacheCount;
      console.log(`🆕 Detected ${newItemsCount} new items, auto-processing...`);

      // Get IDs of already cached items
      const { data: cachedItems } = await supabase
        .from("cloud-topics-cache")
        .select("item_id");

      const cachedItemIds = new Set((cachedItems || []).map(c => c.item_id));

      // Fetch new items that aren't cached yet
      const { data: newItems } = await supabase
        .from("item-data")
        .select("id, type, content, validity")
        .gte("validity", 60)
        .order("order_index", { ascending: true });

      if (newItems && newItems.length > 0) {
        // Process only uncached items
        const itemsToProcess = newItems.filter(item => !cachedItemIds.has(item.id));
        
        if (itemsToProcess.length > 0) {
          console.log(`⚡ Processing ${itemsToProcess.length} new items...`);
          
          // Call batch-process for new items
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/batch-process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              limit: itemsToProcess.length, 
              offset: 0,
              itemIds: itemsToProcess.map(i => i.id)
            })
          });
        }
      }
    }

    // Fetch all cached topics (including newly processed)
    const { data: cachedTopics, error: cacheError } = await supabase
      .from("cloud-topics-cache")
      .select("id, main_topic, category, weight, click_count")
      .order("weight", { ascending: false })
      .limit(50);

    if (!cacheError && cachedTopics && cachedTopics.length > 0) {
      // Transform cached data to CloudTopic format
      const topics = cachedTopics.map((cached) => ({
        id: cached.id,
        text: cached.main_topic,
        weight: cached.weight || 50,
        category: cached.category || "Other",
      }));

      return NextResponse.json(topics);
    }

    // Cache miss - fall back to real-time AI extraction
    console.log("Cache miss, falling back to real-time AI extraction...");

    // Fetch raw data from item-data table (only verified content with validity >= 60)
    const { data: items, error } = await supabase
      .from("item-data")
      .select("id, type, content, validity, order_index")
      .gte("validity", 60)
      .order("order_index", { ascending: true, nullsFirst: false })
      .limit(50);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch item-data" },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json([]);
    }

    // Process each item with AI to extract topics
    const topicsPromises = items.map(async (item) => {
      // Extract text from jsonb content only
      const contentText = extractTextFromJsonb(item.content);
      const fullText = contentText.trim();
      
      const extracted = await extractTopicFromContent(item.type || "content", fullText);
      
      return {
        id: item.id,
        text: extracted.topic,
        weight: extracted.weight,
        category: extracted.category,
      };
    });

    const topics = await Promise.all(topicsPromises);

    // Remove duplicates by topic name
    const uniqueTopics = topics.reduce((acc, topic) => {
      const existing = acc.find(t => t.text.toLowerCase() === topic.text.toLowerCase());
      if (existing) {
        // Keep higher weight
        if (topic.weight > existing.weight) {
          existing.weight = topic.weight;
        }
      } else {
        acc.push(topic);
      }
      return acc;
    }, [] as typeof topics);

    // Sort by weight descending
    uniqueTopics.sort((a, b) => b.weight - a.weight);

    return NextResponse.json(uniqueTopics);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/topics
 * Generate a topic from custom content (no database storage)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, content } = body;

    if (!text && !content) {
      return NextResponse.json(
        { error: "Text or content required" },
        { status: 400 }
      );
    }

    // If content provided, extract topic using AI
    if (content) {
      const extracted = await extractTopicFromContent(text || "Custom", content);
      return NextResponse.json({
        id: `custom-${Date.now()}`,
        text: extracted.topic,
        weight: extracted.weight,
        category: extracted.category,
      }, { status: 201 });
    }

    // Otherwise just create topic from text
    return NextResponse.json({
      id: `custom-${Date.now()}`,
      text: text,
      weight: body.weight || 50,
      category: body.category || "Other",
    }, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
