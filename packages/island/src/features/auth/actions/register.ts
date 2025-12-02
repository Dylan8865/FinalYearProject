"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function register(formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!username || !email || !password) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .or(`email.eq.${email},username.eq.${username}`)
    .single();

  if (existingUser) {
    return { error: "User with this email or username already exists" };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert({
      username,
      email,
      password_hash: passwordHash,
      oxygen: 100,
    })
    .select()
    .single();

  if (insertError) {
    return { error: "Failed to create user" };
  }

  redirect(`/island/${newUser.username}`);
}
