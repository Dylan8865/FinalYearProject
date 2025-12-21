import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types
interface FeedbackRequest {
  messageId: string;
  chatId?: string;
  feedbackType: "positive" | "negative";
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
    const { messageId, chatId, feedbackType, profileId } = body;

    if (!messageId || !feedbackType) {
      return NextResponse.json<FeedbackResponse>({
        success: false,
        error: "Message ID and feedback type are required",
      });
    }

    const supabase = await createClient();

    // Check if feedback already exists for this message and profile
    const { data: existingFeedback } = await supabase
      .from("feedback")
      .select("id")
      .eq("message_id", messageId)
      .eq("profile_id", profileId || null)
      .single();

    let error;

    if (existingFeedback) {
      // Update existing feedback
      const result = await supabase
        .from("feedback")
        .update({
          feedback_type: feedbackType,
        })
        .eq("id", existingFeedback.id);
      error = result.error;
    } else {
      // Insert new feedback
      const result = await supabase
        .from("feedback")
        .insert({
          profile_id: profileId || null,
          chat_id: chatId || null,
          message_id: messageId,
          feedback_type: feedbackType,
        });
      error = result.error;
    }

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

// DELETE - Remove feedback for a message
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");
    const profileId = searchParams.get("profileId");

    if (!messageId || !profileId) {
      return NextResponse.json<FeedbackResponse>({
        success: false,
        error: "Message ID and Profile ID are required",
      });
    }

    const supabase = await createClient();

    console.log(`[Feedback DELETE] Attempting to delete:`, {
      messageId,
      profileId,
    });

    // Delete feedback for this message and profile
    const { data, error } = await supabase
      .from("feedback")
      .delete()
      .eq("message_id", messageId)
      .eq("profile_id", profileId)
      .select();

    console.log(`[Feedback DELETE] Result:`, {
      deletedRows: data?.length || 0,
      error: error?.message || null,
    });

    if (error) {
      console.error("Error deleting feedback:", error);
      return NextResponse.json<FeedbackResponse>({
        success: false,
        error: "Failed to remove feedback",
      });
    }

    return NextResponse.json<FeedbackResponse>({
      success: true,
      message: "Feedback removed",
    });
  } catch (error) {
    console.error("Feedback DELETE error:", error);
    return NextResponse.json<FeedbackResponse>({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}
