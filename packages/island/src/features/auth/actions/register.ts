"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    const { error: profileError } = await supabase.from("profile").insert({
      id: authData.user.id,
      name: name,
      email: email,
      last_login_time: new Date().toISOString(),
      mana: 0,
      level: 1,
      type: "island",
    });

    const { error: islandError } = await supabase.from("island").insert({
      name: '"Hello World" Island',
      level: 1,
      theme: "summer",
      profile_id: authData.user.id,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return { error: "Failed to create user profile" };
    }
  }

  redirect("/login");
}
