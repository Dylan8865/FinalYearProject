import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const islandId = searchParams.get("island_id");

    let query = supabase.from("island-item").select("*, item(*), island(*)");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (islandId) {
      query = query.eq("island_id", islandId);
    }

    const { data: islandItems, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch island items" },
        { status: 500 }
      );
    }

    return NextResponse.json(islandItems);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: islandItem, error } = await supabase
      .from("island-item")
      .insert({
        title: body.title,
        cover_image: body.cover_image,
        level: body.level,
        grid_x: body.grid_x || null,
        grid_y: body.grid_y || null,
        grid_z: body.grid_z || null,
        island_id: body.island_id || null,
        item_id: body.item_id,
        pos_x: body.pos_x || null,
        pos_y: body.pos_y || null,
        user_id: body.user_id,
      })
      .select("*, item(*), island(*)")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create island item" },
        { status: 500 }
      );
    }

    return NextResponse.json(islandItem, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Island item ID is required" },
        { status: 400 }
      );
    }

    const { data: islandItem, error } = await supabase
      .from("island-item")
      .update({
        title: body.title,
        cover_image: body.cover_image,
        level: body.level,
        grid_x: body.grid_x,
        grid_y: body.grid_y,
        grid_z: body.grid_z,
        island_id: body.island_id,
        pos_x: body.pos_x,
        pos_y: body.pos_y,
      })
      .eq("id", body.id)
      .select("*, item(*), island(*)")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update island item" },
        { status: 500 }
      );
    }

    return NextResponse.json(islandItem);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Island item ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("island-item").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete island item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
