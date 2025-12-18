import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types
interface CreateChatRequest {
  title: string;
  profileId?: string;
}

interface ChatResponse {
  success: boolean;
  chat?: {
    id: string;
    title: string;
    created_at: string;
  };
  error?: string;
}

// GET - Fetch all chats for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({
        success: false,
        error: "Profile ID is required",
      });
    }

    const supabase = await createClient();

    const { data: chats, error } = await supabase
      .from("chat")
      .select("id, title, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch chat history",
      });
    }

    return NextResponse.json({
      success: true,
      chats: chats || [],
    });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}

// POST - Create a new chat
export async function POST(request: Request) {
  try {
    const body: CreateChatRequest = await request.json();
    const { title, profileId } = body;

    if (!title) {
      return NextResponse.json<ChatResponse>({
        success: false,
        error: "Title is required",
      });
    }

    const supabase = await createClient();

    const { data: chat, error } = await supabase
      .from("chat")
      .insert({
        title,
        profile_id: profileId || null,
      })
      .select("id, title, created_at")
      .single();

    if (error) {
      console.error("Error creating chat:", error);
      return NextResponse.json<ChatResponse>({
        success: false,
        error: "Failed to create chat",
      });
    }

    return NextResponse.json<ChatResponse>({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json<ChatResponse>({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}

// DELETE - Delete a chat
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    console.log("DELETE request for chatId:", chatId);

    if (!chatId) {
      return NextResponse.json({
        success: false,
        error: "Chat ID is required",
      });
    }

    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Authenticated user:", user?.id);

    // First delete all search history for this chat
    console.log("Deleting search history for chat:", chatId);
    const { error: historyError } = await supabase
      .from("search-history")
      .delete()
      .eq("chat_id", chatId);

    if (historyError) {
      console.error("Error deleting search history:", historyError);
    }

    // Then delete the chat
    console.log("Deleting chat:", chatId);
    const { error, data } = await supabase
      .from("chat")
      .delete()
      .eq("id", chatId)
      .select();

    console.log("Delete result:", { error, data });

    if (error) {
      console.error("Error deleting chat:", error);
      return NextResponse.json({
        success: false,
        error: error.message || "Failed to delete chat",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Chat DELETE error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
