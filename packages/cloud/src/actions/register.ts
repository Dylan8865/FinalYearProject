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

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = await createClient();

  // Sign up with Supabase Auth (same as island/search packages)
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
    // Update profile with user info
    const { error: profileError } = await supabase
      .from("profile")
      .update({
        name: name,
        email: email,
        last_login_time: new Date().toISOString(),
        type: "non-island",
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return { error: "Failed to update user profile" };
    }
  }

  // Redirect to login page after successful registration
  redirect("/login");
}
