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
    // First, get all user's chat IDs
    const { data: userChats } = await supabase
      .from("chat")
      .select("id")
      .eq("profile_id", user.id);

    if (userChats && userChats.length > 0) {
      const chatIds = userChats.map((chat) => chat.id);

      // Delete search-history entries for these chats
      const { error: historyError } = await supabase
        .from("search-history")
        .delete()
        .in("chat_id", chatIds);

      if (historyError) {
        console.error("Search history deletion error:", historyError);
        return { error: `Failed to delete search history: ${historyError.message}` };
      }

      // Delete feedback entries for these chats
      const { error: feedbackError } = await supabase
        .from("feedback")
        .delete()
        .in("chat_id", chatIds);

      if (feedbackError) {
        console.error("Feedback deletion error:", feedbackError);
        return { error: `Failed to delete feedback: ${feedbackError.message}` };
      }
    }

    // Now delete user's chats
    const { data: deletedChats, error: chatsError } = await supabase
      .from("chat")
      .delete()
      .eq("profile_id", user.id)
      .select();

    if (chatsError) {
      console.error("Chats deletion error:", chatsError);
      return { error: `Failed to delete chats: ${chatsError.message}` };
    }
    
    console.log(`Deleted ${deletedChats?.length || 0} chats`);

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
