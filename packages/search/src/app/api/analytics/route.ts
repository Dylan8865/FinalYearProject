import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types
type EventType = 
  | "search" 
  | "view_source" 
  | "click_related_topic" 
  | "feedback_positive" 
  | "feedback_negative"
  | "report"
  | "session_start"
  | "session_end";

interface AnalyticsEvent {
  eventType: EventType;
  profileId?: string;
  chatId?: string;
  messageId?: string;
  query?: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsResponse {
  success: boolean;
  error?: string;
}

// POST - Log an analytics event
export async function POST(request: Request) {
  try {
    const body: AnalyticsEvent = await request.json();
    const { eventType, profileId, chatId, messageId, query, metadata } = body;

    if (!eventType) {
      return NextResponse.json<AnalyticsResponse>({
        success: false,
        error: "Event type is required",
      });
    }

    const supabase = await createClient();

    // Store analytics event in the favourite table (as a flexible storage)
    // Using content field to store event data as JSON
    const eventData = {
      type: "analytics",
      eventType,
      chatId,
      messageId,
      query,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
    };

    const { error } = await supabase
      .from("favourite")
      .insert({
        profile_id: profileId || null,
        content: JSON.stringify(eventData),
        base_weight: 0, // Neutral weight for analytics
      });

    if (error) {
      console.error("Error logging analytics:", error);
      // Don't fail the request for analytics errors
      return NextResponse.json<AnalyticsResponse>({
        success: true, // Return success anyway to not block user experience
      });
    }

    return NextResponse.json<AnalyticsResponse>({
      success: true,
    });
  } catch (error) {
    console.error("Analytics POST error:", error);
    // Don't fail the request for analytics errors
    return NextResponse.json<AnalyticsResponse>({
      success: true,
    });
  }
}

// GET - Retrieve analytics (for admin dashboard)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const supabase = await createClient();

    let query = supabase
      .from("favourite")
      .select("content, created_at")
      .like("content", '%"type":"analytics"%');

    if (eventType) {
      query = query.like("content", `%"eventType":"${eventType}"%`);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(100);

    if (error) {
      console.error("Error fetching analytics:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch analytics",
      });
    }

    // Parse content JSON
    const events = data?.map((item) => ({
      ...JSON.parse(item.content || "{}"),
      created_at: item.created_at,
    })) || [];

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}
