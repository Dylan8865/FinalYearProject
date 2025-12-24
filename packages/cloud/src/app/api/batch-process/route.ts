import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

interface TopicExtractionResult {
  mainTopic: string;
  subTopics: string[];
  category: string;
  weight: number;
}

async function extractTopicsWithAI(
  content: string,
  type: string = "text"
): Promise<TopicExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = `You are analyzing educational content to extract SEMANTIC TOPICS - focus on what the content is ABOUT, not document structure.

Type: ${type}
Content: ${content.slice(0, 2000)}

CONTENT TYPE HANDLING:
- text/paragraph: Extract topics from the written content
- image: Extract topics based on alt text, caption, or description (what the image shows/teaches)
- audio: Extract topics based on title, description, or transcript (what the audio is about)

IMPORTANT RULES:
- Extract topics based on MEANING and SUBJECT MATTER
- IGNORE document structure words like: heading, paragraph, text, image, audio, unlined_line, etc.
- Focus on actual content topics (e.g., if about badminton → "Badminton", not "text")
- Generate AT LEAST 10-15 related sub-topics to explore the subject deeply
- For images/audio: use descriptive text to infer the topic (e.g., "Image of tennis court" → "Tennis")
- If content is URL/path without description, extract topic from filename context

Return ONLY valid JSON:
{
  "mainTopic": "Actual Content Topic (2-4 words, e.g. Badminton, Machine Learning, Photography)",
  "subTopics": ["Concept 1", "Concept 2", "Concept 3", ... at least 10-15 items],
  "category": "Technology|Science|Arts|Sports|Business|Education|Other",
  "weight": 50-100
}

Examples of GOOD topics:
- Text about badminton → {"mainTopic": "Badminton", "subTopics": ["Serving Techniques", "Court Strategy", "Equipment", "Footwork", "Smash Technique", "Defense", "Singles Play", "Doubles Play", "Racket Selection", "Shuttlecock Types", "Training Methods", "Competition Rules"]}
- Image: "Tennis player serving" → {"mainTopic": "Tennis", "subTopics": ["Serve Technique", "Court Positioning", "Racket Grip", "Ball Toss", "Follow Through", "Power Generation", "Spin Control", "Professional Form", "Training Drills", "Match Strategy", "Equipment Setup", "Body Mechanics"]}
- Audio: "Piano tutorial" → {"mainTopic": "Piano Music", "subTopics": ["Chord Progressions", "Scales", "Fingering Techniques", "Rhythm Patterns", "Practice Methods", "Music Theory", "Sheet Reading", "Hand Position", "Pedal Usage", "Dynamics", "Expression", "Beginner Songs"]}

Examples of BAD topics (NEVER do this):
- {"mainTopic": "heading_3"} ❌
- {"mainTopic": "paragraph"} ❌
- {"mainTopic": "image"} ❌
- {"mainTopic": "audio file"} ❌`;

  // Retry logic for rate limits
  let response;
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retry attempt ${attempt + 1} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (response.status === 429 && attempt < 2) {
        lastError = new Error(`Rate limit (429)`);
        continue; // Retry
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      // Success
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 2) break; // Last attempt failed
    }
  }

  if (lastError) {
    throw lastError;
  }

  if (!response) {
    throw new Error("No response from API after retries");
  }

  try {
    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON in AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      mainTopic: result.mainTopic || "Unknown Topic",
      subTopics: result.subTopics || [],
      category: result.category || "Other",
      weight: Math.min(100, Math.max(50, result.weight || 50)),
    };
  } catch (error) {
    console.error("AI extraction error:", error);
    return {
      mainTopic: "Processing Error",
      subTopics: [],
      category: "Other",
      weight: 50,
    };
  }
}

function generateBubbleMapData(mainTopic: string, subTopics: string[]) {
  const nodes = [
    {
      id: "main",
      name: mainTopic,
      type: "main" as const,
      size: 100,
      x: 0,
      y: 0,
      relevance: 100,
    },
    ...subTopics.map((topic, idx) => {
      const angle = (idx / subTopics.length) * 2 * Math.PI;
      return {
        id: `sub-${idx}`,
        name: topic,
        type: "sub" as const,
        size: 60 + Math.random() * 20,
        x: Math.cos(angle) * 200,
        y: Math.sin(angle) * 200,
        relevance: 70 + Math.random() * 30,
      };
    }),
  ];

  const links = subTopics.map((_, idx) => ({
    source: "main",
    target: `sub-${idx}`,
    strength: 0.7 + Math.random() * 0.3,
  }));

  return { nodes, links };
}

/**
 * POST /api/batch-process
 * Process item-data records with validity >= 60 (verified/published content only)
 * Extracts topics using AI and caches results
 */
export async function POST(request: Request) {
  try {
    const { limit = 5, offset = 0, itemIds } = await request.json();

    console.log(`🔄 Batch processing: limit=${limit}, offset=${offset}`);

    const supabase = await createClient();

    // Build query based on whether specific itemIds are provided
    let query = supabase
      .from("item-data")
      .select("id, type, content, validity")
      .gte("validity", 60)
      .order("order_index", { ascending: true });

    // If specific itemIds provided, filter by them
    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      query = query.in("id", itemIds);
      console.log(`🎯 Processing specific items: ${itemIds.length} items`);
    } else {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: items, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        processed: 0,
        message: "No items to process",
      });
    }

    console.log(`📦 Processing ${items.length} items...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        // Extract content based on type
        let contentText = "";
        let contentType = item.type || "text";

        if (typeof item.content === "string") {
          contentText = item.content;
        } else if (item.content && typeof item.content === "object") {
          const content = item.content as Record<string, unknown>;

          // Handle different content types
          if (contentType === "image") {
            // For images: extract alt text, caption, or description
            const imageParts = [
              content.alt,
              content.caption,
              content.description,
              content.title,
              `Image URL: ${content.url || content.src || content.path}`,
            ].filter(Boolean);
            contentText = imageParts.join(" ") || "Image content";
          } else if (contentType === "audio") {
            // For audio: extract title, description, or transcript
            const audioParts = [
              content.title,
              content.description,
              content.transcript,
              content.caption,
              `Audio file: ${content.url || content.src || content.path}`,
            ].filter(Boolean);
            contentText = audioParts.join(" ") || "Audio content";
          } else {
            // For text/other types: extract text fields
            const parts = [
              content.title,
              content.description,
              content.text,
              content.body,
            ].filter(Boolean);
            contentText = parts.join(" ");
          }
        }

        if (!contentText || contentText.length < 5) {
          console.warn(`⚠️ Skipping item ${item.id}: No extractable content`);
          continue;
        }

        // AI extraction with content type context
        const extraction = await extractTopicsWithAI(contentText, contentType);

        // Generate bubble map
        const bubbleMapData = generateBubbleMapData(
          extraction.mainTopic,
          extraction.subTopics
        );

        // Cache result
        const { error: cacheError } = await supabase
          .from("cloud-topics-cache")
          .upsert(
            {
              item_id: item.id,
              main_topic: extraction.mainTopic,
              sub_topics: extraction.subTopics,
              category: extraction.category,
              weight: extraction.weight,
              bubble_map_data: bubbleMapData,
              is_stale: false,
            },
            {
              onConflict: "item_id",
            }
          );

        if (cacheError) {
          console.error(`❌ Cache error for ${item.id}:`, cacheError);
          errorCount++;
        } else {
          console.log(`✅ Cached: ${extraction.mainTopic}`);
          successCount++;
        }

        results.push({
          id: item.id,
          mainTopic: extraction.mainTopic,
          success: !cacheError,
        });

        // Rate limiting: Wait 4 seconds between requests (15 req/min max for Gemini free tier)
        await new Promise((resolve) => setTimeout(resolve, 4000));
      } catch (error) {
        console.error(`💥 Error processing ${item.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      processed: results.length,
      successful: successCount,
      errors: errorCount,
      results,
      hasMore: items.length === limit,
      nextOffset: offset + limit,
    });
  } catch (error) {
    console.error("💥 Batch processing error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
