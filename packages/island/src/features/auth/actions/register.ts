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

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    const { data: profileData, error: profileError } = await supabase
      .from("profile")
      .update({
        name: name,
        email: email,
        last_login_time: new Date().toISOString(),
        mana: 0,
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

    const n = randInt(0, 3);
    const themes = ["spring", "summer", "autumn", "winter"];
    const theme = themes[n];

    const { data: islandData, error: islandError } = await supabase
      .from("island")
      .insert({
        name: "Hello World",
        level: 1,
        theme: theme,
        profile_id: authData.user.id,
        genre: "General",
        last_updated_at: new Date().toISOString(),
        accumulated_mana: 0,
      });

    if (islandError) {
      console.error("Island creation error:", islandError);
      return { error: "Failed to create user island" };
    }
  }

  redirect("/login");
}
