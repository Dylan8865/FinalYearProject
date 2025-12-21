import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/islands/collect-all-mana
 *
 * Collects all accumulated mana from all user's islands at once.
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all islands for this user that have mana > 0
    const { data: islands, error: islandsError } = await supabase
      .from("island")
      .select("id, accumulated_mana")
      .eq("profile_id", user.id);

    if (islandsError) {
      console.error("Error fetching islands:", islandsError);
      return NextResponse.json(
        { error: "Failed to fetch islands" },
        { status: 500 }
      );
    }

    const totalManaToCollect =
      islands?.reduce(
        (acc, island) => acc + (island.accumulated_mana || 0),
        0
      ) || 0;

    if (totalManaToCollect <= 0) {
      return NextResponse.json(
        { error: "No mana to collect" },
        { status: 400 }
      );
    }

    // 2. Fetch current profile mana
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("mana")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const newMana = (profile.mana || 0) + totalManaToCollect;

    // 3. Update profile with new mana amount
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

    // 4. Reset all islands' accumulated_mana
    const islandIds = islands.map((i) => i.id);
    const { error: islandUpdateError } = await supabase
      .from("island")
      .update({
        accumulated_mana: 0,
        last_updated_at: new Date().toISOString(),
      })
      .in("id", islandIds)
      .eq("profile_id", user.id);

    if (islandUpdateError) {
      console.error("Error resetting islands mana:", islandUpdateError);
    }

    return NextResponse.json({
      collected: totalManaToCollect,
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
