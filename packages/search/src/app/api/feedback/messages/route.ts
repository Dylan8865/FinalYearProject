import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch feedback for specific messages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const profileId = searchParams.get("profileId");

    if (!chatId || !profileId) {
      return NextResponse.json({
        success: false,
        error: "Chat ID and Profile ID are required",
      });
    }

    const supabase = await createClient();

    const { data: feedback, error } = await supabase
      .from("feedback")
      .select("message_id, feedback_type")
      .eq("chat_id", chatId)
      .eq("profile_id", profileId);

    if (error) {
      console.error("Error fetching feedback:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch feedback",
      });
    }

    // Convert to a map for easy lookup
    const feedbackMap: { [messageId: string]: "positive" | "negative" } = {};
    feedback?.forEach((item) => {
      feedbackMap[item.message_id] = item.feedback_type as "positive" | "negative";
    });

    return NextResponse.json({
      success: true,
      feedback: feedbackMap,
    });
  } catch (error) {
    console.error("Feedback GET error:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}
