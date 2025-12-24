import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/favorites
 * Save a knowledge graph to user's favorites
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication with Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topicId, topicName, graphData, category } = body;

    if (!topicId || !topicName || !graphData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to database
    const { data, error } = await supabase
      .from("knowledge-graph-favorites")
      .insert({
        user_id: user.id,
        topic_id: topicId,
        topic_name: topicName,
        graph_data: graphData,
        category: category || "Other",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      favorite: data,
    });
  } catch (error) {
    console.error("Error saving favorite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/favorites
 * Fetch user's saved knowledge graphs
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check authentication with Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch user's favorites
    const { data: favorites, error } = await supabase
      .from("knowledge-graph-favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 }
      );
    }

    return NextResponse.json(favorites || []);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites?id=xxx
 * Remove a favorite
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication with Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const favoriteId = url.searchParams.get("id");

    if (!favoriteId) {
      return NextResponse.json(
        { error: "Favorite ID required" },
        { status: 400 }
      );
    }

    // Delete only if it belongs to the user
    const { error } = await supabase
      .from("knowledge-graph-favorites")
      .delete()
      .eq("id", favoriteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
