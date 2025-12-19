import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types
interface FeedbackRequest {
  messageId: string;
  chatId?: string;
  feedbackType: "positive" | "negative";
  comment?: string;
  profileId?: string;
}

interface FeedbackResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// POST - Submit feedback for a message
export async function POST(request: Request) {
  try {
    const body: FeedbackRequest = await request.json();
    const { messageId, chatId, feedbackType, comment, profileId } = body;

    if (!messageId || !feedbackType) {
      return NextResponse.json<FeedbackResponse>({
        success: false,
        error: "Message ID and feedback type are required",
      });
    }

    const supabase = await createClient();

    // Store feedback in the favourite table (repurposed for feedback)
    // Using content field to store feedback data as JSON
    const feedbackData = {
      type: "feedback",
      messageId,
      chatId,
      feedbackType,
      comment: comment || null,
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("favourite")
      .insert({
        profile_id: profileId || null,
        content: JSON.stringify(feedbackData),
        base_weight: feedbackType === "positive" ? 1 : -1,
      });

    if (error) {
      console.error("Error storing feedback:", error);
      return NextResponse.json<FeedbackResponse>({
        success: false,
        error: "Failed to submit feedback",
      });
    }

    return NextResponse.json<FeedbackResponse>({
      success: true,
      message: "Thank you for your feedback!",
    });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json<FeedbackResponse>({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}
