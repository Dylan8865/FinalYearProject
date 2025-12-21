import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/topics/[id]
 * Fetch detailed topic information including sub-topics and bubble map data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: topicId } = await params;

    console.log('🔍 Fetching topic by ID:', topicId);

    // Fetch topic details from cache
    const { data: topic, error } = await supabase
      .from("cloud-topics-cache")
      .select("id, main_topic, sub_topics, category, bubble_map_data, weight")
      .eq("id", topicId)
      .single();

    console.log('📊 Query result:', { topic, error });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!topic) {
      console.error('❌ Topic not found for ID:', topicId);
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    console.log('✅ Topic found:', topic);

    // Transform to frontend format
    return NextResponse.json({
      id: topic.id,
      mainTopic: topic.main_topic,
      category: topic.category || "Other",
      weight: topic.weight || 50,
      subTopics: topic.sub_topics || [],
      bubbleMapData: topic.bubble_map_data || null,
    });
  } catch (error) {
    console.error("💥 Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
