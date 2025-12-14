import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profile_id");
    const islandId = searchParams.get("island_id");

    let query = supabase.from("island-item").select("*, item(*), island(*)");

    if (profileId) {
      query = query.eq("profile_id", profileId);
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

    // Enhance items with resolved image URLs from storage
    const itemsWithImages = islandItems.map((islandItem) => {
      if (islandItem.item) {
        let imageCoverUrl = null;
        let modelUrl = null;

        // Get public URL for cover image if path exists
        if (islandItem.item.image_cover_path) {
          const { data } = supabase.storage
            .from("items")
            .getPublicUrl(islandItem.item.image_cover_path);
          imageCoverUrl = data?.publicUrl || null;
        }

        // Get public URL for 3D model if path exists
        if (islandItem.item.model_path) {
          const { data } = supabase.storage
            .from("items")
            .getPublicUrl(islandItem.item.model_path);
          modelUrl = data?.publicUrl || null;
        }

        return {
          ...islandItem,
          item: {
            ...islandItem.item,
            image_cover_url: imageCoverUrl,
            model_url: modelUrl,
          },
        };
      }
      return islandItem;
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
    function getNextAvailablePosition(
      data: {
        pos_x: number;
        pos_y: number;
      }[],
      gridWidth = 10,
      gridHeight = 5
    ) {
      const used = new Set(data.map((p) => `${p.pos_x},${p.pos_y}`));

      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if (!used.has(`${x},${y}`)) {
            return { pos_x: x, pos_y: y };
          }
        }
      }

      return null;
    }

    const supabase = await createClient();
    const body = await request.json();

    if (body.profile_id == null || body.item_id == null) {
      return NextResponse.json(
        { error: "profile_id and item_id are required" },
        { status: 400 }
      );
    }

    // Find next available inventory slot - no more stacking!
    // Each item gets its own unique slot
    const { data: inventoryPosition, error: inventoryPositionError } =
      await supabase
        .from("island-item")
        .select("pos_x, pos_y")
        .eq("profile_id", body.profile_id);

    if (inventoryPositionError) {
      console.error("Supabase error:", inventoryPositionError);
      return NextResponse.json(
        { error: "Failed to fetch inventory positions" },
        { status: 500 }
      );
    }

    const targetPosition = getNextAvailablePosition(inventoryPosition);
    console.log(`New item ${body.item_id} - next available position:`, targetPosition);

    const { data: islandItem, error } = await supabase
      .from("island-item")
      .insert({
        title: body.title,
        image_cover_path: body.image_cover_path,
        level: body.level,
        grid_x: body.grid_x || null,
        grid_y: body.grid_y || null,
        grid_z: body.grid_z || null,
        island_id: body.island_id || null,
        item_id: body.item_id,
        pos_x: targetPosition ? targetPosition.pos_x : body.pos_x || null,
        pos_y: targetPosition ? targetPosition.pos_y : body.pos_y || null,
        profile_id: body.profile_id,
        status: body.status || null,
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

    // Build update object with optional pos_x/pos_y clearing
    const updateData: Record<string, any> = {
      title: body.title,
      cover_image: body.cover_image,
      level: body.level,
      grid_x: body.grid_x,
      grid_y: body.grid_y,
      grid_z: body.grid_z,
      island_id: body.island_id,
    };
    
    // Handle pos_x/pos_y - they should be null when placing on island
    if (body.pos_x !== undefined) updateData.pos_x = body.pos_x;
    else updateData.pos_x = null;
    
    if (body.pos_y !== undefined) updateData.pos_y = body.pos_y;
    else updateData.pos_y = null;

    const { data: islandItem, error } = await supabase
      .from("island-item")
      .update(updateData)
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

    // Resolve image and model URLs from storage paths
    if (islandItem && islandItem.item) {
      let imageCoverUrl = null;
      let modelUrl = null;

      // Get public URL for cover image if path exists
      if (islandItem.item.image_cover_path) {
        const { data } = supabase.storage
          .from("items")
          .getPublicUrl(islandItem.item.image_cover_path);
        imageCoverUrl = data?.publicUrl || null;
      }

      // Get public URL for 3D model if path exists
      if (islandItem.item.model_path) {
        const { data } = supabase.storage
          .from("items")
          .getPublicUrl(islandItem.item.model_path);
        modelUrl = data?.publicUrl || null;
      }

      // Add resolved URLs to item
      islandItem.item.image_cover_url = imageCoverUrl;
      islandItem.item.model_url = modelUrl;
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

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, pos_x, pos_y, island_id, grid_x, grid_y, grid_z } = body;

    if (!id || pos_x === undefined || pos_y === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: id, pos_x, pos_y" },
        { status: 400 }
      );
    }

    // Build update object - include grid clearing if provided
    const updateData: Record<string, any> = {
      pos_x,
      pos_y,
    };
    
    // If grid coordinates are explicitly provided (even as null), include them
    if (island_id !== undefined) updateData.island_id = island_id;
    if (grid_x !== undefined) updateData.grid_x = grid_x;
    if (grid_y !== undefined) updateData.grid_y = grid_y;
    if (grid_z !== undefined) updateData.grid_z = grid_z;

    const { data, error } = await supabase
      .from("island-item")
      .update(updateData)
      .eq("id", id)
      .select("*, item(*), island(*)")
      .single();

    if (error) {
      console.error("Error updating item position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Resolve image and model URLs from storage paths
    if (data && data.item) {
      let imageCoverUrl = null;
      let modelUrl = null;

      // Get public URL for cover image if path exists
      if (data.item.image_cover_path) {
        const { data: imageData } = supabase.storage
          .from("items")
          .getPublicUrl(data.item.image_cover_path);
        imageCoverUrl = imageData?.publicUrl || null;
      }

      // Get public URL for 3D model if path exists
      if (data.item.model_path) {
        const { data: modelData } = supabase.storage
          .from("items")
          .getPublicUrl(data.item.model_path);
        modelUrl = modelData?.publicUrl || null;
      }

      // Add resolved URLs to item
      data.item.image_cover_url = imageCoverUrl;
      data.item.model_url = modelUrl;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/island-items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
