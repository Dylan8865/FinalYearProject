"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Provider = "google";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Step 1: Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Authentication failed" };
  }

  // Step 2: Check if user is admin in profile table
  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("type")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    // Sign out the user since they're not in profile table
    await supabase.auth.signOut();
    return { error: "Invalid email or password" };
  }

  // Step 3: Check if user type is "admin"
  if (profile.type !== "admin") {
    // Sign out the user since they're not an admin
    await supabase.auth.signOut();
    return { error: "Invalid email or password" };
  }

  // Step 4: Update last login time
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '');
  const { error: updateError } = await supabase
    .from("profile")
    .update({ last_login_time: now })
    .eq("id", authData.user.id);

  if (updateError) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to update last login time:", updateError);
    }
    // Don't fail the login for this, just log it
  }

  // Step 5: User is authenticated and is an admin
  revalidatePath("/", "layout");
  return { error: null };
}

export async function oAuthLogin(provider: Provider) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: null };
}