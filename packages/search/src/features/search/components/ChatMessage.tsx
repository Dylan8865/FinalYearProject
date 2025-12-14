"use client";

import { Message } from "./SearchPage";
import { useTheme } from "../context/ThemeContext";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
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
              {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          ))}
        </div>

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
