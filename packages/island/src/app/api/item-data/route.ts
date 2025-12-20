import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const islandItemId = searchParams.get("island_item_id");

    if (!islandItemId) {
      return NextResponse.json(
        { error: "island_item_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("item-data")
      .select("*")
      .eq("island_item_id", islandItemId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch item data" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
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

    const {
      island_item_id,
      type,
      content,
      properties,
      parent_id,
      order_index,
    } = body;

    if (!island_item_id || !type) {
      return NextResponse.json(
        { error: "island_item_id and type are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("item-data")
      .insert({
        island_item_id,
        type,
        content: content || null,
        properties: properties || null,
        parent_id: parent_id || null,
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create item data" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
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

    const { id, type, content, properties, parent_id, order_index } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (type !== undefined) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (properties !== undefined) updateData.properties = properties;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (order_index !== undefined) updateData.order_index = order_index;

    const { data, error } = await supabase
      .from("item-data")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update item data" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
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
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase.from("item-data").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete item data" },
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
