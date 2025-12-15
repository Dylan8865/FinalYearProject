import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  calculateIslandTotalManaRate,
  calculateAccumulatedMana,
  MAX_ACCUMULATION_TIME,
} from "@/utils/manaCalculations";

/**
 * POST /api/islands/collect-mana
 *
 * Collects accumulated mana from an island and adds it to the user's profile.
 *
 * Request body:
 * - island_id: string - The island to collect mana from
 * - last_collection_time: string (ISO date) - When mana was last collected
 *
 * Response:
 * - collected: number - Amount of mana collected
 * - new_mana: number - User's updated mana balance
 * - mana_rate: number - Current mana rate (for display)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { island_id, last_collection_time } = body;

    if (!island_id) {
      return NextResponse.json(
        { error: "Island ID is required" },
        { status: 400 }
      );
    }

    // Fetch the island with its level
    const { data: island, error: islandError } = await supabase
      .from("island")
      .select("*")
      .eq("id", island_id)
      .eq("profile_id", user.id)
      .single();

    if (islandError || !island) {
      return NextResponse.json(
        { error: "Island not found or unauthorized" },
        { status: 404 }
      );
    }

    // Fetch all items placed on this island
    const { data: islandItems, error: itemsError } = await supabase
      .from("island-item")
      .select(
        `
        *,
        item:item_id (
          id,
          name,
          mana_rate,
          type
        )
      `
      )
      .eq("island_id", island_id)
      .not("grid_x", "is", null);

    if (itemsError) {
      console.error("Error fetching island items:", itemsError);
    }

    // Calculate total mana rate for the island
    const manaRate = calculateIslandTotalManaRate(island, islandItems || []);

    // Calculate time elapsed since last collection
    const lastCollectionDate = last_collection_time
      ? new Date(last_collection_time)
      : new Date(Date.now() - 60000); // Default: 1 minute ago if no previous collection

    const now = new Date();
    const elapsedSeconds = Math.min(
      (now.getTime() - lastCollectionDate.getTime()) / 1000,
      MAX_ACCUMULATION_TIME
    );

    // Calculate mana to collect
    const collectedMana = calculateAccumulatedMana(manaRate, elapsedSeconds);

    if (collectedMana <= 0) {
      return NextResponse.json({
        collected: 0,
        new_mana: 0,
        mana_rate: manaRate,
        message: "No mana to collect yet",
      });
    }

    // Fetch current profile mana
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("mana")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Update profile with new mana amount
    const newMana = (profile.mana || 0) + collectedMana;

    const { error: updateError } = await supabase
      .from("profile")
      .update({ mana: newMana })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating profile mana:", updateError);
      return NextResponse.json(
        { error: "Failed to update mana" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      collected: collectedMana,
      new_mana: newMana,
      mana_rate: manaRate,
      collection_time: now.toISOString(),
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
