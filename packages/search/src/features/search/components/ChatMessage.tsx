"use client";

import { useState } from "react";
import { Message, SearchSource } from "./SearchPage";
import { useTheme } from "../context/ThemeContext";

interface ChatMessageProps {
  message: Message;
  onRelatedTopicClick?: (topic: string) => void;
  onFeedback?: (messageId: string, type: "positive" | "negative") => void;
  onReport?: (messageId: string, reason: string, details?: string) => void;
}

// Validity badge component
function ValidityBadge({ score }: { score: number }) {
  let bgColor = "bg-green-500";
  let label = "High";
  
  if (score < 70) {
    bgColor = "bg-yellow-500";
    label = "Medium";
  } else if (score >= 90) {
    bgColor = "bg-emerald-500";
    label = "Verified";
  }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${bgColor} px-2 py-0.5 text-xs font-medium text-white`}>
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {label} ({score}%)
    </span>
  );
}

// Source card component
function SourceCard({ source, isDark }: { source: SearchSource; isDark: boolean }) {
  const cardBg = isDark ? "bg-gray-700/50" : "bg-gray-50";
  const cardBorder = isDark ? "border-gray-600" : "border-gray-200";
  const titleColor = isDark ? "text-teal-400" : "text-teal-600";
  const textColor = isDark ? "text-gray-300" : "text-gray-600";
  
  return (
    <div className={`rounded-lg border ${cardBorder} ${cardBg} p-3`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className={`text-sm font-medium ${titleColor}`}>{source.title}</h4>
        <ValidityBadge score={source.validityScore} />
      </div>
      <p className={`text-xs ${textColor} line-clamp-2`}>
        {source.content.slice(0, 150)}...
      </p>
      <button 
        className={`mt-2 text-xs ${titleColor} hover:underline`}
        onClick={() => {/* TODO: Open source modal */}}
      >
        View original →
      </button>
    </div>
  );
}

// Feedback buttons component
function FeedbackButtons({ 
  messageId, 
  currentFeedback, 
  isDark,
  onFeedback,
  onReport
}: { 
  messageId: string; 
  currentFeedback?: "positive" | "negative" | null;
  isDark: boolean;
  onFeedback?: (messageId: string, type: "positive" | "negative") => void;
  onReport?: (messageId: string, reason: string, details?: string) => void;
}) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<"positive" | "negative" | null>(currentFeedback || null);
  const [showThankYou, setShowThankYou] = useState(false);

  const buttonBase = `p-1.5 rounded-lg transition-colors`;
  const inactiveStyle = isDark 
    ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" 
    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100";

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedbackGiven(type);
    setShowThankYou(true);
    onFeedback?.(messageId, type);
    setTimeout(() => setShowThankYou(false), 2000);
  };

  const handleReport = () => {
    if (reportReason) {
      onReport?.(messageId, reportReason, reportDetails);
      setShowReportForm(false);
      setReportReason("");
      setReportDetails("");
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      {/* Feedback buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFeedback("positive")}
          className={`${buttonBase} ${feedbackGiven === "positive" ? "text-green-500 bg-green-500/10" : inactiveStyle}`}
          title="Helpful"
        >
          <svg className="h-4 w-4" fill={feedbackGiven === "positive" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
        <button
          onClick={() => handleFeedback("negative")}
          className={`${buttonBase} ${feedbackGiven === "negative" ? "text-red-500 bg-red-500/10" : inactiveStyle}`}
          title="Not helpful"
        >
          <svg className="h-4 w-4" fill={feedbackGiven === "negative" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        </button>
      </div>

      {/* Thank you message */}
      {showThankYou && (
        <span className={`text-xs ${isDark ? "text-green-400" : "text-green-600"}`}>
          Thank you for your feedback!
        </span>
      )}

      {/* Report button */}
      <button
        onClick={() => setShowReportForm(!showReportForm)}
        className={`${buttonBase} ${inactiveStyle} ml-auto`}
        title="Report this response"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </button>

      {/* Report form */}
      {showReportForm && (
        <div className={`absolute right-0 top-full z-10 mt-2 w-72 rounded-lg border ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"} p-4 shadow-lg`}>
          <h4 className={`mb-3 text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            Report this content
          </h4>
          <div className="space-y-2">
            {["inaccurate", "inappropriate", "spam", "other"].map((reason) => (
              <label key={reason} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={reportReason === reason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="text-teal-500"
                />
                <span className={`text-sm capitalize ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {reason}
                </span>
              </label>
            ))}
          </div>
          <textarea
            placeholder="Additional details (optional)"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            className={`mt-3 w-full rounded-lg border ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"} p-2 text-sm`}
            rows={2}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleReport}
              disabled={!reportReason}
              className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50"
            >
              Submit Report
            </button>
            <button
              onClick={() => setShowReportForm(false)}
              className={`rounded-lg px-3 py-1.5 text-sm ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatMessage({ message, onRelatedTopicClick, onFeedback, onReport }: ChatMessageProps) {
  const { theme } = useTheme();
  const isUser = message.role === "user";

  const isDark = theme === "dark";
  const assistantBg = isDark ? "bg-gray-800" : "bg-white border border-gray-200";
  const assistantText = isDark ? "text-gray-100" : "text-gray-900";
  const userAvatarBg = isDark ? "bg-gray-600" : "bg-gray-500";
  const timestampText = isDark ? "text-gray-500" : "text-gray-400";
  const loadingDotBg = isDark ? "bg-gray-400" : "bg-gray-500";

  if (message.isLoading) {
    return (
      <div className="mb-8 flex animate-fade-in gap-5">
        {/* Assistant Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5 pt-3">
          <span className={`animate-pulse-dot h-2.5 w-2.5 rounded-full ${loadingDotBg}`}></span>
          <span className={`animate-pulse-dot h-2.5 w-2.5 rounded-full ${loadingDotBg}`}></span>
          <span className={`animate-pulse-dot h-2.5 w-2.5 rounded-full ${loadingDotBg}`}></span>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-8 flex animate-fade-in gap-5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {isUser ? (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${userAvatarBg} text-white`}>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-4 ${
          isUser
            ? "bg-teal-600 text-white"
            : `${assistantBg} ${assistantText}`
        }`}
      >
        <div className="text-base leading-relaxed">
          {message.content.split("\n").map((line, i) => (
            <p key={i} className="mb-2.5 last:mb-0">
              {line.split(/(\*\*.*?\*\*)|(_.*?_)/).map((part, j) => {
                if (!part) return null;
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith("_") && part.endsWith("_")) {
                  return <em key={j} className="text-sm opacity-75">{part.slice(1, -1)}</em>;
                }
                return part;
              })}
            </p>
          ))}
        </div>

        {/* Sources Section */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 border-t border-gray-600/30 pt-4">
            <h3 className={`mb-3 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              📚 Sources ({message.sources.length})
            </h3>
            <div className="grid gap-2">
              {message.sources.slice(0, 3).map((source) => (
                <SourceCard key={source.id} source={source} isDark={isDark} />
              ))}
            </div>
            {message.sources.length > 3 && (
              <button className={`mt-2 text-sm ${isDark ? "text-teal-400" : "text-teal-600"} hover:underline`}>
                Show {message.sources.length - 3} more sources
              </button>
            )}
          </div>
        )}

        {/* Related Topics Section */}
        {!isUser && message.relatedTopics && message.relatedTopics.length > 0 && (
          <div className="mt-4 border-t border-gray-600/30 pt-4">
            <h3 className={`mb-2 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              🔗 Related Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {message.relatedTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => onRelatedTopicClick?.(topic)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-teal-600 hover:text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-teal-500 hover:text-white"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback and Report Section (only for assistant messages) */}
        {!isUser && !message.isLoading && (
          <div className="relative">
            <FeedbackButtons
              messageId={message.id}
              currentFeedback={message.feedback}
              isDark={isDark}
              onFeedback={onFeedback}
              onReport={onReport}
            />
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`mt-3 text-sm ${
            isUser ? "text-teal-200" : timestampText
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
