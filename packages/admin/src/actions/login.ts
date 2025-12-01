"use server";

import { createClient } from "@/src/supabase/server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

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
    .from("user")
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
    .from("user")
    .update({ last_login_time: new Date().toISOString() })
    .eq("id", user.id);

  // TODO (Maybe): Set session/cookie etc.
  redirect("/");
}
