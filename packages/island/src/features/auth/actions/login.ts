"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  // Fetch user by email
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("type", "island")
    .eq("email", email)
    .single();

  if (fetchError || !user) {
    return { error: "Invalid email or password" };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return { error: "Invalid email or password" };
  }

  // Create session (you'd implement this based on your auth strategy)
  // For now, redirect to the island page
  redirect(`/island/${user.username}`);
}
