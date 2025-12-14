import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();

  // 1. Check if user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?error=session_expired");
  }

  // 2. Check if user is admin
  const { data: profile } = await supabase
    .from("profile")
    .select("type, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.type !== "admin") {
    await supabase.auth.signOut();
    redirect("/login?error=not_admin");
  }

  // Note: Inactivity timeout is now handled in middleware.ts
  // Middleware updates the last_activity cookie on every request

  return { user, profile };
}
