import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

/**
 * POST /api/knowledge-graph/generate-subtopics
 * Generate sub-topics for a parent topic (Matryoshka doll drilling)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { parentTopicId, parentTopicName, currentDepth } = body;

    if (!parentTopicId || !parentTopicName) {
      return NextResponse.json(
        { error: "Parent topic ID and name required" },
        { status: 400 }
      );
    }

    // Check depth limit (max 5 levels)
    if (currentDepth >= 5) {
      return NextResponse.json({
        reachedLimit: true,
        message: "📍 Maximum depth reached. This is the most specific level.",
        subTopics: []
      });
    }

    // Use admin client to bypass RLS policies for cache operations
    const supabase = createAdminClient();

    // Check if sub-topics already exist in cache
    const { data: existingSubTopics } = await supabase
      .from("cloud-topics-cache")
      .select("*")
      .eq("parent_topic_id", parentTopicId);

    if (existingSubTopics && existingSubTopics.length > 0) {
      return NextResponse.json({
        subTopics: existingSubTopics,
        fromCache: true
      });
    }

    // Generate new sub-topics using AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const prompt = `You are analyzing a knowledge topic in a hierarchical structure (like Russian Matryoshka dolls - nesting dolls).

PARENT TOPIC: "${parentTopicName}"
CURRENT DEPTH: Level ${currentDepth + 1}

Generate 8-12 SPECIFIC sub-topics that:
1. Are MORE SPECIFIC than the parent topic (drill down, not sideways)
2. Are concrete and actionable
3. Represent natural subdivisions of the parent topic
4. Are suitable for Level ${currentDepth + 1} specificity

Examples of good drilling:
- Parent: "Gym Workout" → Sub: "Strength Training", "Cardio", "Flexibility"
- Parent: "Strength Training" → Sub: "Upper Body", "Lower Body", "Core"
- Parent: "Upper Body" → Sub: "Chest Exercises", "Back Exercises", "Shoulder Exercises"

Return ONLY a JSON array of strings (topic names). No explanations.
Example format: ["Topic 1", "Topic 2", "Topic 3"]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    const jsonMatch = aiText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const subTopicNames: string[] = JSON.parse(jsonMatch[0]);

    // Save sub-topics to database
    const subTopicsToInsert = subTopicNames.map((name) => ({
      main_topic: name,
      parent_topic_id: parentTopicId,
      depth_level: currentDepth + 1,
      category: "Drill-down",
      weight: 50,
      sub_topics: [],
      has_children: currentDepth + 1 < 4 // Can have children if not at level 4+
    }));

    const { data: insertedTopics, error: insertError } = await supabase
      .from("cloud-topics-cache")
      .insert(subTopicsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save sub-topics");
    }

    // Update parent to mark it has children
    await supabase
      .from("cloud-topics-cache")
      .update({ has_children: true })
      .eq("id", parentTopicId);

    return NextResponse.json({
      subTopics: insertedTopics,
      generated: true,
      count: insertedTopics?.length || 0
    });

  } catch (error) {
    console.error("❌ Error generating sub-topics:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Failed to generate sub-topics",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
