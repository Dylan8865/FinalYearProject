"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin-client";

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
    // Delete user's profile - CASCADE will handle:
    // - island → island-item → item-data → cloud-topics-cache
    // - chat → feedback
    // - favourite
    // - knowledge-graph-favorites
    // SET NULL will preserve:
    // - search-history (chat_id set to NULL)
    // - validation-log (item_id set to NULL)
    const { error: profileError } = await supabase
      .from("profile")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile deletion error:", profileError);
      return { error: "Failed to delete profile" };
    }

    // Delete from auth.users using service role key
    const adminClient = createAdminClient();

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    );
    if (deleteError) {
      console.error("Auth deletion error:", deleteError);
      return { error: "Failed to delete auth account" };
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
