import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user's chats (will cascade delete search-history and feedback due to FK)
    const { error: chatsError } = await supabase
      .from("chat")
      .delete()
      .eq("profile_id", user.id);

    if (chatsError) {
      console.error("Chats deletion error:", chatsError);
      return NextResponse.json(
        { error: "Failed to delete chats" },
        { status: 500 }
      );
    }

    // Delete user's profile
    const { error: profileError } = await supabase
      .from("profile")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile deletion error:", profileError);
      return NextResponse.json(
        { error: "Failed to delete profile" },
        { status: 500 }
      );
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

    return NextResponse.json(
      { success: true, message: "Profile deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error during profile deletion:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
