"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

interface FeedbackAnalytics {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  satisfactionRate: number;
  feedbackByChat: { [key: string]: { positive: number; negative: number; total: number } };
  recentFeedback: Array<{
    id: string;
    feedback_type: string;
    created_at: string;
    chatTitle: string;
    chatId: string;
  }>;
  mostHelpfulTopics: Array<{
    chatId: string;
    title: string;
    positiveCount: number;
    createdAt: string;
  }>;
}

interface AnalyticsDashboardProps {
  userId: string;
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-[#1a1a1a]" : "bg-[#f5f5f5]";
  const cardBg = isDark ? "bg-gray-800" : "bg-white";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const mutedTextColor = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-300";

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics/feedback?profileId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAnalytics();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className={`p-8 ${bgColor}`}>
        <div className={`text-center ${mutedTextColor}`}>Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`p-8 ${bgColor}`}>
        <div className={`text-center ${mutedTextColor}`}>No analytics data available</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${bgColor}`}>
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <a
          href="/search"
          className={`mb-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isDark
              ? "text-gray-400 hover:bg-gray-800 hover:text-white"
              : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Search
        </a>

        <h1 className={`mb-8 text-3xl font-bold ${textColor}`}>Feedback Analytics</h1>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Total Feedback */}
          <div className={`rounded-lg border ${borderColor} ${cardBg} p-6`}>
            <div className={`text-sm ${mutedTextColor}`}>Total Feedback</div>
            <div className={`mt-2 text-3xl font-bold ${textColor}`}>
              {analytics.totalFeedback}
            </div>
          </div>

          {/* Positive Feedback */}
          <div className={`rounded-lg border ${borderColor} ${cardBg} p-6`}>
            <div className={`text-sm ${mutedTextColor}`}>Positive</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-green-500">
                {analytics.positiveFeedback}
              </div>
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
          </div>

          {/* Negative Feedback */}
          <div className={`rounded-lg border ${borderColor} ${cardBg} p-6`}>
            <div className={`text-sm ${mutedTextColor}`}>Negative</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-red-500">
                {analytics.negativeFeedback}
              </div>
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </div>
          </div>

          {/* Satisfaction Rate */}
          <div className={`rounded-lg border ${borderColor} ${cardBg} p-6`}>
            <div className={`text-sm ${mutedTextColor}`}>Satisfaction Rate</div>
            <div className={`mt-2 text-3xl font-bold text-teal-500`}>
              {analytics.satisfactionRate}%
            </div>
          </div>
        </div>

        {/* Recent Feedback */}
        <div className={`rounded-lg border ${borderColor} ${cardBg} p-6`}>
          <h2 className={`mb-4 text-xl font-semibold ${textColor}`}>Recent Feedback</h2>
          
          {analytics.recentFeedback.length === 0 ? (
            <div className={`text-center py-8 ${mutedTextColor}`}>
              No feedback yet. Start conversations and get feedback!
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.recentFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`flex items-center justify-between rounded-lg border ${borderColor} p-4`}
                >
                  <div className="flex items-center gap-3">
                    {feedback.feedback_type === "positive" ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${textColor} truncate`}>{feedback.chatTitle}</div>
                      <div className={`text-sm ${mutedTextColor}`}>
                        {new Date(feedback.created_at).toLocaleDateString()} at{" "}
                        {new Date(feedback.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-sm font-medium ${
                        feedback.feedback_type === "positive" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {feedback.feedback_type === "positive" ? "Helpful" : "Not Helpful"}
                    </div>
                    <a
                      href={`/search?chatId=${feedback.chatId}`}
                      className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Revisit
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
