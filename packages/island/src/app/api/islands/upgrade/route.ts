import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, level, cost } = await request.json();

    if (!id || !level || cost === undefined || cost === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Get current profile mana
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("mana")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.mana < cost) {
      return NextResponse.json({ error: "Insufficient mana" }, { status: 400 });
    }

    // 2. Perform transaction: update island level and deduct mana
    // Note: Since Supabase RPC isn't always set up for custom transactions, we'll do it sequentially
    // but ideally this should be an RPC or a Supabase Transaction if available in your structure.
    // For now we will update profile first, then island. If island fails we ideally should revert, but for MVP:

    // Update profile mana
    const { error: updateProfileError } = await supabase
      .from("profile")
      .update({ mana: profile.mana - cost })
      .eq("id", user.id);

    if (updateProfileError) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Update island level
    const { data: island, error: updateIslandError } = await supabase
      .from("island")
      .update({ level })
      .eq("id", id)
      .eq("profile_id", user.id)
      .select()
      .single();

    if (updateIslandError) {
      // Critical error: Mana deducted but island not updated.
      // In a real app we'd refund here.
      console.error(
        "CRITICAL: Failed to update island after deducting mana",
        updateIslandError
      );
      return NextResponse.json(
        { error: "Failed to update island level" },
        { status: 500 }
      );
    }

    return NextResponse.json(island);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
