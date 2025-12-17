import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Extract query parameter from URL
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Handle single item request (when ?id=xxx is present)
    if (id) {
      const { data: item, error } = await supabase
        .from("item")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: "Failed to fetch item" },
          { status: 500 }
        );
      }

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      // Process single item
      let imageCoverUrl = null;
      if (item.image_cover_path) {
        const { data } = supabase.storage
          .from("items")
          .getPublicUrl(item.image_cover_path);
        imageCoverUrl = data?.publicUrl || null;
      }

      return NextResponse.json({
        ...item,
        image_cover_url: imageCoverUrl,
      });
    }

    // Handle multiple items request (no ?id parameter)
    const { data: items, error } = await supabase
      .from("item")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    // Process multiple items
    const itemsWithImages = (items || []).map((item) => {
      let imageCoverUrl = null;
      if (item.image_cover_path) {
        const { data } = supabase.storage
          .from("items")
          .getPublicUrl(item.image_cover_path);
        imageCoverUrl = data?.publicUrl || null;
      }

      return {
        ...item,
        image_cover_url: imageCoverUrl,
      };
    });

    return NextResponse.json(itemsWithImages);
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

    const { data: item, error } = await supabase
      .from("item")
      .insert({
        name: body.name,
        mana_rate: body.mana_rate || 0,
        type: body.type || "resource",
        mana_required: body.mana_required || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create item" },
        { status: 500 }
      );
    }

    return NextResponse.json(item, { status: 201 });
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
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from("item")
      .update({
        name: body.name,
        mana_rate: body.mana_rate,
        type: body.type,
        mana_required: body.mana_required,
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update item" },
        { status: 500 }
      );
    }

    return NextResponse.json(item);
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
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("item").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete item" },
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
