import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

interface ProcessContentRequest {
  content: string;
  type?: string;
  title?: string;
}

interface TopicExtractionResult {
  mainTopic: string;
  subTopics: string[];
  category: string;
  weight: number;
}

/**
 * Extract topics from content using Gemini AI
 */
async function extractTopicsWithAI(content: string, type: string = "text"): Promise<TopicExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = `You are analyzing educational content to extract SEMANTIC TOPICS - focus on what the content is ABOUT, not document structure.

Type: ${type}
Content: ${content.slice(0, 2000)}

IMPORTANT RULES:
- Extract topics based on MEANING and SUBJECT MATTER
- IGNORE document structure words like: heading, paragraph, text, image, audio, unlined_line, etc.
- Focus on actual content topics (e.g., if about badminton → "Badminton", not "text")
- If content is HTML/metadata without clear topic, use generic terms like "Document", "Content"

Return ONLY valid JSON:
{
  "mainTopic": "Actual Content Topic (2-4 words, e.g. Badminton, Machine Learning, Photography)",
  "subTopics": ["Related concept 1", "Related concept 2", "Related concept 3"],
  "category": "Technology|Science|Arts|Sports|Business|Education|Other",
  "weight": 50-100
}

Examples of GOOD topics:
- Content about playing badminton → {"mainTopic": "Badminton", "subTopics": ["Serving Techniques", "Court Strategy", "Equipment"]}
- Content about AI → {"mainTopic": "Artificial Intelligence", "subTopics": ["Neural Networks", "Deep Learning", "Applications"]}

Examples of BAD topics (NEVER do this):
- {"mainTopic": "heading_3"} ❌
- {"mainTopic": "paragraph"} ❌
- {"mainTopic": "text"} ❌`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract JSON from response
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
    // Return fallback
    return {
      mainTopic: "Processing Error",
      subTopics: [],
      category: "Other",
      weight: 50,
    };
  }
}

/**
 * Generate bubble map data structure
 */
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
 * POST /api/process
 * Process content and extract topics with AI, then cache results
 */
export async function POST(request: Request) {
  try {
    const body: ProcessContentRequest = await request.json();
    const { content, type = "text", title } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    console.log("🔄 Processing content:", { type, title, contentLength: content.length });

    // Step 1: Extract topics using AI
    const extraction = await extractTopicsWithAI(content, type);
    console.log("✅ AI extraction complete:", extraction);

    // Step 2: Generate bubble map data
    const bubbleMapData = generateBubbleMapData(extraction.mainTopic, extraction.subTopics);

    // Step 3: Cache to Supabase
    const supabase = await createClient();
    
    const { data: cached, error: cacheError } = await supabase
      .from("cloud-topics-cache")
      .insert({
        main_topic: extraction.mainTopic,
        sub_topics: extraction.subTopics,
        category: extraction.category,
        weight: extraction.weight,
        bubble_map_data: bubbleMapData,
        is_stale: false,
      })
      .select()
      .single();

    if (cacheError) {
      console.error("❌ Cache error:", cacheError);
      return NextResponse.json(
        { error: `Failed to cache: ${cacheError.message}` },
        { status: 500 }
      );
    }

    console.log("💾 Cached to database:", cached.id);

    return NextResponse.json({
      success: true,
      topic: {
        id: cached.id,
        mainTopic: extraction.mainTopic,
        subTopics: extraction.subTopics,
        category: extraction.category,
        weight: extraction.weight,
        bubbleMapData,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("💥 Processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
