import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types
interface CreateHistoryRequest {
  chatId: string;
  promptText: string;
  resultText: string;
  promptOrder: number;
}

interface HistoryResponse {
  success: boolean;
  history?: {
    id: string;
    prompt_text: string;
    result_text: string;
    prompt_order: number;
    created_at: string;
  };
  error?: string;
}

// GET - Fetch search history for a chat
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({
        success: false,
        error: "Chat ID is required",
      });
    }

    const supabase = await createClient();

    const { data: history, error } = await supabase
      .from("search-history")
      .select("id, prompt_text, result_text, prompt_order, created_at")
      .eq("chat_id", chatId)
      .order("prompt_order", { ascending: true });

    if (error) {
      console.error("Error fetching history:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch search history",
      });
    }

    return NextResponse.json({
      success: true,
      history: history || [],
    });
  } catch (error) {
    console.error("History GET error:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}

// POST - Add a search to history
export async function POST(request: Request) {
  try {
    const body: CreateHistoryRequest = await request.json();
    const { chatId, promptText, resultText, promptOrder } = body;

    if (!chatId || !promptText) {
      return NextResponse.json<HistoryResponse>({
        success: false,
        error: "Chat ID and prompt text are required",
      });
    }

    const supabase = await createClient();

    const { data: history, error } = await supabase
      .from("search-history")
      .insert({
        chat_id: chatId,
        prompt_text: promptText,
        result_text: resultText || "",
        prompt_order: promptOrder || 0,
      })
      .select("id, prompt_text, result_text, prompt_order, created_at")
      .single();

    if (error) {
      console.error("Error creating history:", error);
      return NextResponse.json<HistoryResponse>({
        success: false,
        error: "Failed to save search history",
      });
    }

    return NextResponse.json<HistoryResponse>({
      success: true,
      history,
    });
  } catch (error) {
    console.error("History POST error:", error);
    return NextResponse.json<HistoryResponse>({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}
