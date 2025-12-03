"use client";

import { Message } from "./SearchPage";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (message.isLoading) {
    return (
      <div className="mb-6 flex animate-fade-in gap-4">
        {/* Assistant Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
          <svg
            className="h-5 w-5 text-white"
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
        <div className="flex items-center gap-1 pt-2">
          <span className="animate-pulse-dot h-2 w-2 rounded-full bg-muted-foreground"></span>
          <span className="animate-pulse-dot h-2 w-2 rounded-full bg-muted-foreground"></span>
          <span className="animate-pulse-dot h-2 w-2 rounded-full bg-muted-foreground"></span>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-6 flex animate-fade-in gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg
            className="h-5 w-5"
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
          <svg
            className="h-5 w-5 text-white"
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
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.content.split("\n").map((line, i) => (
            <p key={i} className="mb-2 last:mb-0">
              {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={j}>{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          ))}
        </div>

        {/* Timestamp */}
        <div
          className={`mt-2 text-xs ${
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Actions for assistant messages */}
      {!isUser && (
        <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Copy"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
