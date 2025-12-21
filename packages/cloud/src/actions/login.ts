"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Server-side validation
  if (!email || !password) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();

  // Check if email exists
  const { data: user, error: fetchError } = await supabase
    .from("profile")
    .select("id, email, password, name")
    .eq("email", email)
    .single();

  if (fetchError || !user) {
    return { error: "Invalid email or password" };
  }

  // Compare password with hashed password
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "Invalid email or password" };
  }

  // Update last_login_time
  await supabase
    .from("profile")
    .update({ last_login_time: new Date().toISOString() })
    .eq("id", user.id);

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("user_id");
  redirect("/login");
}

export async function getUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return null;
  }

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("profile")
    .select("id, email, name")
    .eq("id", userId)
    .single();

  return user;
}
