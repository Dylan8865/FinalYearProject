import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { item_id, profile_id, mana_cost } = body;

    // Default level to 1 if not provided
    const level = body.level || 1;

    if (!item_id || !profile_id || mana_cost === undefined) {
      return NextResponse.json(
        { error: "item_id, profile_id, and mana_cost are required" },
        { status: 400 }
      );
    }

    // 1. Fetch current profile to check mana and get current value
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("mana")
      .eq("id", profile_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    if (profile.mana < mana_cost) {
      return NextResponse.json(
        { error: "Not enough mana" },
        { status: 400 }
      );
    }

    const newMana = profile.mana - mana_cost;

    // 2. Determine inventory position
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

    const { data: inventoryPosition, error: inventoryPositionError } =
      await supabase
        .from("island-item")
        .select("pos_x, pos_y")
        .eq("profile_id", profile_id);

    if (inventoryPositionError) {
      return NextResponse.json(
        { error: "Failed to fetch inventory positions" },
        { status: 500 }
      );
    }

    const targetPosition = getNextAvailablePosition(inventoryPosition);

    // 3. Create Island Item
    const { data: newItem, error: insertError } = await supabase
      .from("island-item")
      .insert({
        item_id,
        profile_id,
        level,
        pos_x: targetPosition ? targetPosition.pos_x : null,
        pos_y: targetPosition ? targetPosition.pos_y : null,
        grid_x: null,
        grid_y: null,
        grid_z: null,
        island_id: null,
      })
      .select("*, item(*), island(*)")
      .single();

    if (insertError) {
      console.error("Failed to insert item:", insertError);
      return NextResponse.json(
        { error: "Failed to create island item" },
        { status: 500 }
      );
    }

    // 4. Update Profile Mana
    const { error: updateError } = await supabase
      .from("profile")
      .update({ mana: newMana })
      .eq("id", profile_id);

    if (updateError) {
      console.error("Failed to update mana, rolling back item creation:", updateError);
      
      // ROLLBACK: Delete the created item
      const { error: deleteError } = await supabase
        .from("island-item")
        .delete()
        .eq("id", newItem.id);

      if (deleteError) {
        console.error("CRITICAL: Failed to rollback item creation:", deleteError);
        // In a real system, we might log this to a critical error queue
      }

      return NextResponse.json(
        { error: "Failed to process purchase" },
        { status: 500 }
      );
    }

    // Resolve image URLs akin to original route
    if (newItem && newItem.item) {
        let imageCoverUrl = null;
        let modelUrl = null;

        if (newItem.item.image_cover_path) {
          const { data } = supabase.storage
            .from("items")
            .getPublicUrl(newItem.item.image_cover_path);
          imageCoverUrl = data?.publicUrl || null;
        }

        if (newItem.item.model_path) {
          const { data } = supabase.storage
            .from("items")
            .getPublicUrl(newItem.item.model_path);
          modelUrl = data?.publicUrl || null;
        }

        newItem.item.image_cover_url = imageCoverUrl;
        newItem.item.model_url = modelUrl;
    }

    // Return both the new item and the updated mana to keep client in sync
    return NextResponse.json({
        item: newItem,
        mana: newMana
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
