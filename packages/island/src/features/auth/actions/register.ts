"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { randInt } from "three/src/math/MathUtils.js";

export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();

  // Try to sign up first
  let { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  // If user already exists, try to sign in to verify they own the account
  if (authError?.message === "User already registered") {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return {
        error:
          "This email is already registered. Please provide the correct password to register as an island account, or use a different email.",
      };
    }

    authData = signInData;
    authError = null;
  }

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // First, check if profile is already an island account
    const { data: existingProfile } = await supabase
      .from("profile")
      .select("type")
      .eq("id", authData.user.id)
      .single();

    if (existingProfile?.type === "island") {
      return {
        error:
          "You already have an island account. Please go to the login page.",
      };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profile")
      .update({
        name: name,
        email: email,
        last_login_time: new Date().toISOString(),
        mana: 1_000_000,
        level: 1,
        type: "island",
      })
      .eq("id", authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error("Profile update error:", profileError);
      return { error: "Failed to update user profile" };
    }

    // Check if island already exists for this profile
    const { data: existingIsland } = await supabase
      .from("island")
      .select("id")
      .eq("profile_id", authData.user.id)
      .limit(1);

    if (!existingIsland || existingIsland.length === 0) {
      const n = randInt(0, 3);
      const themes = ["spring", "summer", "autumn", "winter"];
      const theme = themes[n];

      const { data: islandData, error: islandError } = await supabase
        .from("island")
        .insert({
          name: `${name} #1`,
          level: 1,
          theme: theme,
          profile_id: authData.user.id,
          description: "General",
          last_updated_at: new Date().toISOString(),
          accumulated_mana: 0,
        });

      if (islandError) {
        console.error("Island creation error:", islandError);
        return { error: "Failed to create user island" };
      }
    }
  }

  redirect("/login");
}
