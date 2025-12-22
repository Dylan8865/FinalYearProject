import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch feedback analytics
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

    // Get all feedback for this user
    const { data: allFeedback, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch feedback",
      });
    }

    // Calculate statistics
    const totalFeedback = allFeedback?.length || 0;
    const positiveFeedback = allFeedback?.filter(f => f.feedback_type === "positive").length || 0;
    const negativeFeedback = allFeedback?.filter(f => f.feedback_type === "negative").length || 0;
    const satisfactionRate = totalFeedback > 0 
      ? Math.round((positiveFeedback / totalFeedback) * 100) 
      : 0;

    // Group by chat
    const feedbackByChat: { [key: string]: { positive: number; negative: number; total: number } } = {};
    allFeedback?.forEach(feedback => {
      if (feedback.chat_id) {
        if (!feedbackByChat[feedback.chat_id]) {
          feedbackByChat[feedback.chat_id] = { positive: 0, negative: 0, total: 0 };
        }
        feedbackByChat[feedback.chat_id].total++;
        if (feedback.feedback_type === "positive") {
          feedbackByChat[feedback.chat_id].positive++;
        } else {
          feedbackByChat[feedback.chat_id].negative++;
        }
      }
    });

    // Get recent feedback with chat titles
    const recentFeedback = await Promise.all(
      (allFeedback?.slice(0, 10) || []).map(async (feedback) => {
        if (feedback.chat_id) {
          const { data: chat } = await supabase
            .from("chat")
            .select("title")
            .eq("id", feedback.chat_id)
            .single();
          
          return {
            ...feedback,
            chatTitle: chat?.title || "Unknown Chat",
          };
        }
        return {
          ...feedback,
          chatTitle: "Unknown Chat",
        };
      })
    );

    // Get most helpful topics (chats with positive feedback)
    const positiveFeedbackChats = allFeedback?.filter(f => f.feedback_type === "positive" && f.chat_id) || [];
    const chatFeedbackCount: { [key: string]: { count: number; title: string; chatId: string } } = {};
    
    positiveFeedbackChats.forEach(feedback => {
      if (feedback.chat_id) {
        if (!chatFeedbackCount[feedback.chat_id]) {
          chatFeedbackCount[feedback.chat_id] = { 
            count: 0, 
            title: "", 
            chatId: feedback.chat_id 
          };
        }
        chatFeedbackCount[feedback.chat_id].count++;
      }
    });

    // Get chat titles and sort by count
    const mostHelpfulTopics = await Promise.all(
      Object.values(chatFeedbackCount).map(async (item) => {
        const { data: chat } = await supabase
          .from("chat")
          .select("title, created_at")
          .eq("id", item.chatId)
          .single();
        
        return {
          chatId: item.chatId,
          title: chat?.title || "Unknown Chat",
          positiveCount: item.count,
          createdAt: chat?.created_at,
        };
      })
    );

    // Sort by positive count and take top 5
    const topHelpfulTopics = mostHelpfulTopics
      .sort((a, b) => b.positiveCount - a.positiveCount)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      analytics: {
        totalFeedback,
        positiveFeedback,
        negativeFeedback,
        satisfactionRate,
        feedbackByChat,
        recentFeedback,
        mostHelpfulTopics: topHelpfulTopics,
      },
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}
