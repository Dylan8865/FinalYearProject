import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types
type ReportReason = "inaccurate" | "inappropriate" | "spam" | "other";

interface ReportRequest {
  messageId: string;
  chatId?: string;
  reason: ReportReason;
  details?: string;
  profileId?: string;
}

interface ReportResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// POST - Submit a content report
export async function POST(request: Request) {
  try {
    const body: ReportRequest = await request.json();
    const { messageId, chatId, reason, details, profileId } = body;

    if (!messageId || !reason) {
      return NextResponse.json<ReportResponse>({
        success: false,
        error: "Message ID and reason are required",
      });
    }

    // Validate reason
    const validReasons: ReportReason[] = ["inaccurate", "inappropriate", "spam", "other"];
    if (!validReasons.includes(reason)) {
      return NextResponse.json<ReportResponse>({
        success: false,
        error: "Invalid report reason",
      });
    }

    const supabase = await createClient();

    // Store report in the favourite table (repurposed for reports)
    // Using content field to store report data as JSON
    const reportData = {
      type: "report",
      messageId,
      chatId,
      reason,
      details: details || null,
      status: "pending", // pending, reviewed, resolved
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("favourite")
      .insert({
        profile_id: profileId || null,
        content: JSON.stringify(reportData),
        base_weight: -10, // Flag as report with negative weight
      });

    if (error) {
      console.error("Error storing report:", error);
      return NextResponse.json<ReportResponse>({
        success: false,
        error: "Failed to submit report",
      });
    }

    // TODO: Send notification to administrator (can be implemented with Supabase Edge Functions)
    // For now, we just log it
    console.log("Content report submitted:", reportData);

    return NextResponse.json<ReportResponse>({
      success: true,
      message: "Thank you for reporting. Our administrators will review this content.",
    });
  } catch (error) {
    console.error("Report POST error:", error);
    return NextResponse.json<ReportResponse>({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}
