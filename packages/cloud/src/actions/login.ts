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

  // Update last_login_time and set type to 'non-island' if not already set
  const now = new Date().toISOString();
  
  // First check if profile exists and get current type
  const { data: profile } = await supabase
    .from("profile")
    .select("type")
    .eq("id", authData.user.id)
    .single();
  
  // Update last_login_time and set type if null
  const updateData: { last_login_time: string; type?: string } = {
    last_login_time: now,
  };
  
  if (!profile?.type) {
    updateData.type = "non-island";
  }
  
  await supabase
    .from("profile")
    .update(updateData)
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
