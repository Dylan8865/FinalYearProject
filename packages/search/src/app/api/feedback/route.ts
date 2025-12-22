import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function to propagate feedback to knowledge entries
// No action needed - feedback is already in the 'feedback' table
// Engagement scores are calculated on-the-fly during search
async function propagateFeedbackToEntries(
  supabase: any,
  messageId: string,
  feedbackType: "positive" | "negative"
) {
  // No-op: feedback is already stored in 'feedback' table
  // Search will calculate engagement scores on-the-fly by querying feedback + search-history
  console.log(`[Feedback] ${feedbackType} feedback stored for message ${messageId} (will be calculated on-the-fly)`);
}

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

    console.log('[Feedback POST] Request:', { messageId, feedbackType, profileId });

    // Check if feedback already exists for this message and profile
    const { data: existingFeedback, error: fetchError } = await supabase
      .from("feedback")
      .select("id, feedback_type")
      .eq("message_id", messageId)
      .eq("profile_id", profileId || null)
      .order("created_at", { ascending: false })
      .limit(1);

    console.log('[Feedback POST] Existing feedback:', existingFeedback);

    let error;

    if (existingFeedback && existingFeedback.length > 0) {
      const feedback = existingFeedback[0];
      
      console.log('[Feedback POST] Found existing, comparing:', { 
        existing: feedback.feedback_type, 
        new: feedbackType 
      });
      
      // Only update if feedback type is different
      if (feedback.feedback_type !== feedbackType) {
        console.log('[Feedback POST] Updating feedback type');
        const result = await supabase
          .from("feedback")
          .update({
            feedback_type: feedbackType,
          })
          .eq("id", feedback.id);
        
        console.log('[Feedback POST] Update result:', { 
          error: result.error, 
          status: result.status,
          statusText: result.statusText 
        });
        
        error = result.error;
        
        if (result.error) {
          console.error('[Feedback POST] Update failed:', result.error);
        }
      } else {
        console.log('[Feedback POST] Same feedback type, skipping update');
      }
    } else {
      console.log('[Feedback POST] Creating new feedback');
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

    // Propagate feedback to underlying knowledge entries
    await propagateFeedbackToEntries(supabase, messageId, feedbackType);

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
