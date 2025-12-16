import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/islands/collect-mana
 *
 * Collects accumulated mana from an island and adds it to the user's profile.
 *
 * Request body:
 * - island_id: string - The island to collect mana from
 * - mana_to_collect: number - Amount of mana to collect (sent from frontend)
 *
 * Response:
 * - collected: number - Amount of mana collected
 * - new_mana: number - User's updated mana balance
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
    const { island_id, mana_to_collect } = body;

    if (!island_id) {
      return NextResponse.json(
        { error: "Island ID is required" },
        { status: 400 }
      );
    }

    if (!mana_to_collect || mana_to_collect <= 0) {
      return NextResponse.json(
        { error: "No mana to collect" },
        { status: 400 }
      );
    }

    // Verify the island belongs to the user
    const { data: island, error: islandError } = await supabase
      .from("island")
      .select("id, profile_id")
      .eq("id", island_id)
      .eq("profile_id", user.id)
      .single();

    if (islandError || !island) {
      return NextResponse.json(
        { error: "Island not found or unauthorized" },
        { status: 404 }
      );
    }

    // Fetch current profile mana
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("mana")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const collectedMana = Math.floor(mana_to_collect);
    const newMana = (profile.mana || 0) + collectedMana;

    // Update profile with new mana amount
    const { error: updateProfileError } = await supabase
      .from("profile")
      .update({ mana: newMana })
      .eq("id", user.id);

    if (updateProfileError) {
      console.error("Error updating profile mana:", updateProfileError);
      return NextResponse.json(
        { error: "Failed to update mana" },
        { status: 500 }
      );
    }

    // Reset island's accumulated_mana and update last_updated_at
    const { error: islandUpdateError } = await supabase
      .from("island")
      .update({
        accumulated_mana: 0,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", island_id)
      .eq("profile_id", user.id);

    if (islandUpdateError) {
      console.error("Error resetting island mana:", islandUpdateError);
      // Don't fail - profile was already updated
    }

    return NextResponse.json({
      collected: collectedMana,
      new_mana: newMana,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
