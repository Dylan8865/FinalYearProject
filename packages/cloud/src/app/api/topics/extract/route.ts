import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route: /api/topics/extract
 * 
 * Extracts topics from item-data using Gemini AI and returns
 * formatted data for the frontend UI (Topics List + Bubble Map)
 * 
 * NO DATABASE STORAGE - Direct JSON response to frontend
 * 
 * item-data table schema:
 * - id: uuid
 * - created_at: timestamptz
 * - type: text
 * - content: jsonb (the actual content data)
 * - island-item-id: uuid
 * - valid: bool
 * - order_index: int4
 * - metadata: jsonb
 * - parent-block-id: uuid
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * Extract text from jsonb content field
 */
function extractTextFromJsonb(content: unknown): string {
  if (!content) return "";
  
  if (typeof content === "string") return content;
  
  if (typeof content === "object") {
    const obj = content as Record<string, unknown>;
    
    // Try common text fields
    if (obj.text) return String(obj.text);
    if (obj.title) return String(obj.title);
    if (obj.body) return String(obj.body);
    if (obj.description) return String(obj.description);
    if (obj.value) return String(obj.value);
    
    // Stringify and extract text
    const jsonStr = JSON.stringify(content);
    return jsonStr.replace(/[{}\[\]":,]/g, " ").trim();
  }
  
  return String(content);
}

interface SubTopic {
  name: string;
  relevance: number;
  description?: string;
}

interface ExtractedTopic {
  id: string;
  main_topic: string;
  sub_topics: SubTopic[];
  category: string;
  original_title?: string;
}

interface BubbleNode {
  id: string;
  name: string;
  type: "main" | "sub";
  size: number;
  x: number;
  y: number;
  relevance?: number;
}

interface BubbleLink {
  source: string;
  target: string;
  strength: number;
}

interface BubbleMapData {
  main_topic: string;
  category: string;
  nodes: BubbleNode[];
  links: BubbleLink[];
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
 * Extract main topic and sub-topics from content using AI
 */
async function extractTopicFromContent(content: string): Promise<{
  main_topic: string;
  sub_topics: SubTopic[];
  category: string;
}> {
  const prompt = `Analyze the following educational content and extract:
1. The MAIN TOPIC (2-4 words, like "Machine Learning", "World History", "Organic Chemistry")
2. 5-8 related SUB-TOPICS that branch from the main topic

Content to analyze:
---
${content.slice(0, 3000)}
---

Return ONLY valid JSON in this exact format:
{
    "main_topic": "Main Topic Name",
    "sub_topics": [
        {"name": "Sub Topic 1", "relevance": 0.9},
        {"name": "Sub Topic 2", "relevance": 0.85},
        {"name": "Sub Topic 3", "relevance": 0.8},
        {"name": "Sub Topic 4", "relevance": 0.75},
        {"name": "Sub Topic 5", "relevance": 0.7}
    ],
    "category": "Science|Technology|Mathematics|History|Language|Arts|Geography|Health"
}

Return ONLY the JSON, no other text or markdown.`;

  try {
    const result = await callGemini(prompt);

    // Clean up response (remove markdown code blocks if present)
    let cleanResult = result.trim();
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.split("```")[1];
      if (cleanResult.startsWith("json")) {
        cleanResult = cleanResult.slice(4);
      }
    }

    return JSON.parse(cleanResult);
  } catch (error) {
    console.error("Topic extraction error:", error);
    return {
      main_topic: "Unknown Topic",
      sub_topics: [],
      category: "Other",
    };
  }
}

/**
 * Generate sub-topics for a specific main topic
 */
async function generateSubTopics(mainTopic: string, count: number = 6): Promise<SubTopic[]> {
  const prompt = `Generate ${count} educational sub-topics that branch from the main topic "${mainTopic}".

These sub-topics should be:
- Directly related to ${mainTopic}
- Suitable for students learning about ${mainTopic}
- Cover different aspects of the subject

Return ONLY valid JSON array:
[
    {"name": "Sub Topic 1", "relevance": 0.95},
    {"name": "Sub Topic 2", "relevance": 0.9}
]

Return ONLY the JSON array, no other text.`;

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
  } catch (error) {
    console.error("Sub-topic generation error:", error);
    return [];
  }
}

/**
 * Format topic data for Bubble Map visualization
 */
function formatForBubbleMap(topicData: ExtractedTopic): BubbleMapData {
  const { main_topic, sub_topics, category } = topicData;

  // Create center node (main topic)
  const nodes: BubbleNode[] = [
    {
      id: "center",
      name: main_topic,
      type: "main",
      size: 100,
      x: 0,
      y: 0,
    },
  ];

  // Create sub-topic nodes arranged in a circle
  const numSubtopics = sub_topics.length;

  sub_topics.forEach((subtopic, i) => {
    const angle = (2 * Math.PI * i) / numSubtopics;
    const radius = 200;
    const relevance = subtopic.relevance || 0.5;

    nodes.push({
      id: `sub_${i}`,
      name: subtopic.name,
      type: "sub",
      size: 40 + relevance * 30,
      relevance,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  });

  // Create links from center to each sub-topic
  const links: BubbleLink[] = sub_topics.map((subtopic, i) => ({
    source: "center",
    target: `sub_${i}`,
    strength: subtopic.relevance || 0.5,
  }));

  return {
    main_topic,
    category,
    nodes,
    links,
  };
}

/**
 * GET: Extract topics from all item-data records
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch raw content from item-data table (only verified content with validity >= 60)
    const { data: itemData, error } = await supabase
      .from("item-data")
      .select("id, type, content, validity")
      .gte("validity", 60)  // Only get verified items (60-100 validity score)
      .limit(50);

    if (error) {
      console.error("Database error:", error);
      // Return sample data if database fails
      return NextResponse.json(getSampleResponse());
    }

    if (!itemData || itemData.length === 0) {
      // Return sample data if no records
      return NextResponse.json(getSampleResponse());
    }

    // Process each item and extract topics
    const extractedTopics: ExtractedTopic[] = [];

    for (const item of itemData) {
      // Extract text from jsonb content only
      const contentText = extractTextFromJsonb(item.content);
      const fullText = contentText.trim();

      if (!fullText) continue;

      const extracted = await extractTopicFromContent(fullText);

      extractedTopics.push({
        id: item.id,
        original_title: item.type,
        main_topic: extracted.main_topic,
        sub_topics: extracted.sub_topics,
        category: extracted.category,
      });
    }

    // Format for UI
    const response = {
      topics: extractedTopics.map((t) => ({
        id: t.id,
        main_topic: t.main_topic,
        category: t.category,
        sub_topic_count: t.sub_topics.length,
      })),
      bubble_maps: extractedTopics.map(formatForBubbleMap),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Extract topics error:", error);
    return NextResponse.json(getSampleResponse());
  }
}

/**
 * POST: Extract topics from provided content or generate for a specific topic
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, content, topic } = body;

    switch (action) {
      // Extract topic from raw content
      case "extract": {
        if (!content) {
          return NextResponse.json(
            { error: "Content is required for extraction" },
            { status: 400 }
          );
        }

        const extracted = await extractTopicFromContent(content);
        const bubbleMap = formatForBubbleMap({
          id: "custom",
          main_topic: extracted.main_topic,
          sub_topics: extracted.sub_topics,
          category: extracted.category,
        });

        return NextResponse.json({
          main_topic: extracted.main_topic,
          sub_topics: extracted.sub_topics,
          category: extracted.category,
          bubble_map: bubbleMap,
        });
      }

      // Generate sub-topics for a given main topic
      case "generate_subtopics": {
        if (!topic) {
          return NextResponse.json(
            { error: "Topic is required" },
            { status: 400 }
          );
        }

        const subTopics = await generateSubTopics(topic);
        const bubbleMap = formatForBubbleMap({
          id: "generated",
          main_topic: topic,
          sub_topics: subTopics,
          category: "Generated",
        });

        return NextResponse.json({
          main_topic: topic,
          sub_topics: subTopics,
          bubble_map: bubbleMap,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'extract' or 'generate_subtopics'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Sample response for testing/demo without database
 */
function getSampleResponse() {
  const sampleTopics: ExtractedTopic[] = [
    {
      id: "1",
      main_topic: "Machine Learning",
      original_title: "Introduction to ML",
      category: "Technology",
      sub_topics: [
        { name: "Supervised Learning", relevance: 0.95 },
        { name: "Unsupervised Learning", relevance: 0.9 },
        { name: "Neural Networks", relevance: 0.88 },
        { name: "Deep Learning", relevance: 0.85 },
        { name: "Model Evaluation", relevance: 0.8 },
        { name: "Feature Engineering", relevance: 0.75 },
      ],
    },
    {
      id: "2",
      main_topic: "Web Development",
      original_title: "Full-Stack Bootcamp",
      category: "Technology",
      sub_topics: [
        { name: "HTML & CSS", relevance: 0.95 },
        { name: "JavaScript", relevance: 0.92 },
        { name: "React Framework", relevance: 0.88 },
        { name: "Node.js Backend", relevance: 0.85 },
        { name: "Database Design", relevance: 0.8 },
        { name: "API Development", relevance: 0.78 },
      ],
    },
    {
      id: "3",
      main_topic: "World History",
      original_title: "Ancient Civilizations",
      category: "History",
      sub_topics: [
        { name: "Ancient Rome", relevance: 0.92 },
        { name: "Ancient Greece", relevance: 0.9 },
        { name: "Egyptian Empire", relevance: 0.88 },
        { name: "Mesopotamia", relevance: 0.85 },
        { name: "Ancient China", relevance: 0.82 },
        { name: "Medieval Period", relevance: 0.75 },
      ],
    },
    {
      id: "4",
      main_topic: "Data Science",
      original_title: "Data Analytics Course",
      category: "Technology",
      sub_topics: [
        { name: "Data Visualization", relevance: 0.93 },
        { name: "Statistical Analysis", relevance: 0.9 },
        { name: "Python Programming", relevance: 0.88 },
        { name: "Big Data", relevance: 0.82 },
        { name: "Data Cleaning", relevance: 0.8 },
        { name: "Predictive Modeling", relevance: 0.78 },
      ],
    },
    {
      id: "5",
      main_topic: "Golden Retrievers",
      original_title: "Dog Breeds Guide",
      category: "Science",
      sub_topics: [
        { name: "Friendly", relevance: 0.95 },
        { name: "Intelligent", relevance: 0.92 },
        { name: "Loyal", relevance: 0.9 },
        { name: "Active", relevance: 0.85 },
        { name: "Affectionate", relevance: 0.88 },
        { name: "Even-tempered", relevance: 0.8 },
      ],
    },
  ];

  return {
    topics: sampleTopics.map((t) => ({
      id: t.id,
      main_topic: t.main_topic,
      category: t.category,
      sub_topic_count: t.sub_topics.length,
    })),
    bubble_maps: sampleTopics.map(formatForBubbleMap),
  };
}
