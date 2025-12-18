"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signInWithOAuth(
  provider: "google" | "facebook" | "apple"
) {
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  console.log("SignInWithOAuth:", {
    origin,
    host,
    redirectTo: `${origin}/auth/callback`,
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("OAuth error:", error.message);
    return { error: error.message };
  }

  if (data.url) {
    console.log("Supabase OAuth URL:", data.url);
    redirect(data.url);
  }

  return { error: "Failed to get OAuth URL" };
}
