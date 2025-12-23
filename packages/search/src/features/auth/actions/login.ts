"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // First check if profile exists and get current type
    const { data: profile } = await supabase
      .from("profile")
      .select("type")
      .eq("id", data.user.id)
      .single();
    
    // Update last login time and set type to 'non-island' if null
    const updateData: { last_login_time: string; type?: string } = {
      last_login_time: new Date().toISOString(),
    };
    
    if (!profile?.type) {
      updateData.type = "non-island";
    }
    
    await supabase
      .from("profile")
      .update(updateData)
      .eq("id", data.user.id);
  }

  redirect("/search");
}
