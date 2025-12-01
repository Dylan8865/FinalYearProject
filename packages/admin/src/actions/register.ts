"use server";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function register(formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Server-side validation
  if (!username || !email || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const supabase = await createClient();

  // Check if username exists
  const { data: existingUsername } = await supabase
    .from("user")
    .select("id")
    .eq("name", username)
    .single();

  if (existingUsername) {
    return { error: "Username already exists" };
  }

  // Check if email exists
  const { data: existingEmail } = await supabase
    .from("user")
    .select("id")
    .eq("email", email)
    .single();

  if (existingEmail) {
    return { error: "An account is already associated with this email" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert new user
  const { error: insertError } = await supabase.from("user").insert({
    name: username,
    email: email,
    password: hashedPassword,
    oxygen: 0,
    level: 1,
  });

  if (insertError) {
    return { error: "Registration failed. Please try again." };
  }

  redirect("/login");
}
