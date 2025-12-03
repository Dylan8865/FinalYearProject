"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function register(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/login?message=Check your email to confirm your account");
}
