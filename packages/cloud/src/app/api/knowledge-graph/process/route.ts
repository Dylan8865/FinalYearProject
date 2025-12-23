import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

interface TopicInput {
  id: string;
  main_topic: string;
  sub_topics: string[];
}

interface BulkRelationship {
  sourceId: string;
  targetId: string;
  strength: number;
  type: "related" | "prerequisite" | "application" | "opposite";
  reasoning: string;
}

/**
 * Analyze ALL topic relationships in one AI call (much faster!)
 */
async function analyzeBulkRelationships(topics: TopicInput[]): Promise<BulkRelationship[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Create topic list for AI
  const topicList = topics.map((t, idx) => 
    `${idx + 1}. ID: ${t.id}, Topic: "${t.main_topic}", Sub-topics: [${t.sub_topics.slice(0, 5).join(", ")}]`
  ).join("\n");

  const prompt = `Analyze relationships between these ${topics.length} knowledge topics and return ALL meaningful connections.

TOPICS:
${topicList}

For each pair of related topics, identify:
- strength: 0.4-1.0 (only include if strength >= 0.4)
- type: "related" (share domain), "prerequisite" (A needed for B), "application" (B applies A), or "opposite" (contrast)
- reasoning: Brief 1-sentence explanation

Return ONLY valid JSON array:
[
  {
    "sourceIndex": 1,
    "targetIndex": 3,
    "strength": 0.8,
    "type": "related",
    "reasoning": "Both topics cover web development frameworks"
  },
  ...
]

Focus on strong connections (strength >= 0.4). Return empty array [] if no strong relationships found.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192, // Increased for bulk response
        },
      }),
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in AI response");
      return [];
    }

    const results = JSON.parse(jsonMatch[0]);
    
    // Convert indices to IDs
    return results.map((r: any) => ({
      sourceId: topics[r.sourceIndex - 1]?.id,
      targetId: topics[r.targetIndex - 1]?.id,
      strength: Math.min(1, Math.max(0.4, r.strength || 0.5)),
      type: r.type || "related",
      reasoning: r.reasoning || "Related topics"
    })).filter((r: any) => r.sourceId && r.targetId);

  } catch (error) {
    console.error("Bulk relationship analysis error:", error);
    return [];
  }
}

/**
 * POST /api/knowledge-graph/process
 * Analyze relationships for a specific topic (on-demand)
 */
export async function POST(request: Request) {
  try {
    const { topicId } = await request.json();

    if (!topicId) {
      return NextResponse.json({ error: "topicId required" }, { status: 400 });
    }

    console.log(`🔗 Processing relationships for topic: ${topicId}`);

    // Use admin client to bypass RLS policies
    const supabase = createAdminClient();

    // Check if relationships already exist for this topic
    const { data: existing } = await supabase
      .from("topic-relationships")
      .select("id")
      .eq("source_topic_id", topicId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('✅ Relationships already exist for this topic');
      return NextResponse.json({
        message: "Relationships already exist",
        cached: true,
      });
    }

    // Fetch the selected topic
    const { data: selectedTopic, error: topicError } = await supabase
      .from("cloud-topics-cache")
      .select("id, main_topic, sub_topics")
      .eq("id", topicId)
      .single();

    if (topicError || !selectedTopic) {
      throw new Error("Topic not found");
    }

    // Fetch all other topics to compare against
    const { data: allTopics, error: fetchError } = await supabase
      .from("cloud-topics-cache")
      .select("id, main_topic, sub_topics")
      .neq("id", topicId);

    if (fetchError || !allTopics) {
      throw new Error("Failed to fetch topics");
    }

    console.log(`📊 Analyzing ${selectedTopic.main_topic} vs ${allTopics.length} other topics...`);

    // Analyze this topic vs all others
    const topics = [selectedTopic, ...allTopics];
    const relationships = await analyzeBulkRelationships(topics);

    // Filter to only relationships involving the selected topic
    const relevantRelationships = relationships.filter(
      rel => rel.sourceId === topicId || rel.targetId === topicId
    );

    if (relevantRelationships.length === 0) {
      return NextResponse.json({
        message: "No strong relationships found",
        relationships: 0,
      });
    }

    console.log(`✅ Found ${relevantRelationships.length} relationships for ${selectedTopic.main_topic}`);

    // Store relationships (bidirectional)
    const insertData = [];
    for (const rel of relevantRelationships) {
      // Forward direction
      insertData.push({
        source_topic_id: rel.sourceId,
        target_topic_id: rel.targetId,
        strength: rel.strength,
        relationship_type: rel.type,
        reasoning: rel.reasoning,
      });
      
      // Reverse direction (for bidirectional graph)
      insertData.push({
        source_topic_id: rel.targetId,
        target_topic_id: rel.sourceId,
        strength: rel.strength,
        relationship_type: rel.type,
        reasoning: rel.reasoning,
      });
    }

    const { error: insertError } = await supabase
      .from("topic-relationships")
      .insert(insertData);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to store relationships");
    }

    return NextResponse.json({
      success: true,
      relationships: relevantRelationships.length,
      totalEdges: insertData.length,
      message: `Found ${relevantRelationships.length} connections for ${selectedTopic.main_topic}`,
    });

  } catch (error) {
    console.error("💥 Knowledge graph processing error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Processing failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}