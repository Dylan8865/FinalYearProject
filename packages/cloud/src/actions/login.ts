"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Server-side validation
  if (!email || !password) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();

  // Authenticate with Supabase Auth (same as admin package)
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

  // Update last_login_time
  const now = new Date().toISOString();
  await supabase
    .from("profile")
    .update({ last_login_time: now })
    .eq("id", authData.user.id);

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profile")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
