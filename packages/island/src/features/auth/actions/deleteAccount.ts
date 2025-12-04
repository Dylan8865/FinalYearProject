"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function deleteAccount() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  try {
    // Delete user's islands (will cascade delete island_items due to FK)
    const { error: islandsError } = await supabase
      .from("island")
      .delete()
      .eq("profile_id", user.id);

    if (islandsError) {
      console.error("Islands deletion error:", islandsError);
      return { error: "Failed to delete islands" };
    }

    // Delete user's profile
    const { error: profileError } = await supabase
      .from("profile")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile deletion error:", profileError);
      return { error: "Failed to delete profile" };
    }

    // Sign out the user
    await supabase.auth.signOut();

    // Clear all auth cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
        cookieStore.delete(cookie.name);
      }
    });

    // Clear cache
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    return { error: "An unexpected error occurred" };
  }

  redirect("/");
}
