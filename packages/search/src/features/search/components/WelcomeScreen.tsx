"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useTheme } from "../context/ThemeContext";

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

const suggestions = [
  {
    icon: "🏝️",
    title: "Explore Islands",
    prompt: "What islands are available on Wisdom Island?",
  },
  {
    icon: "📚",
    title: "Learn Something",
    prompt: "Teach me something interesting today",
  },
  {
    icon: "🎯",
    title: "Get Started",
    prompt: "How do I get started with Wisdom Island?",
  },
  {
    icon: "💡",
    title: "Tips & Tricks",
    prompt: "What are some tips for using Wisdom Island effectively?",
  },
];

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greeting = getGreeting();

  const isDark = theme === "dark";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const mutedTextColor = isDark ? "text-gray-400" : "text-gray-600";
  const placeholderColor = isDark ? "placeholder:text-gray-500" : "placeholder:text-gray-400";
  const borderColor = isDark ? "border-gray-600" : "border-gray-400";
  const cardBg = isDark ? "bg-gray-800/50" : "bg-white";
  const cardBorder = isDark ? "border-gray-700" : "border-gray-300";
  const cardHoverBg = isDark ? "hover:bg-gray-800" : "hover:bg-gray-100";
  const kbdBg = isDark ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-600";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim()) {
      onSuggestionClick(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center px-6">
      {/* Greeting */}
      <h1 className={`mb-10 text-5xl font-light ${textColor}`}>{greeting}</h1>

      {/* Search Input */}
      <div className="w-full max-w-2xl">
        <div className={`relative flex items-end rounded-full border ${borderColor} bg-transparent px-6 py-4 transition-colors focus-within:border-teal-400`}>
          {/* Search Icon */}
          <svg
            className={`mb-1 mr-4 h-6 w-6 shrink-0 ${mutedTextColor}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to learn today?"
            rows={1}
            className={`max-h-[200px] min-h-[28px] flex-1 resize-none break-all whitespace-pre-wrap bg-transparent text-lg ${textColor} outline-none ${placeholderColor}`}
          />

          {/* Submit button (appears when there's input) */}
          {input.trim() && (
            <button
              onClick={handleSubmit}
              className="ml-3 text-teal-400 hover:text-teal-300"
            >
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
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Grid */}
      <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className={`group flex flex-col items-start gap-3 rounded-xl border ${cardBorder} ${cardBg} p-5 text-left transition-all hover:border-teal-500/50 ${cardHoverBg}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{suggestion.icon}</span>
              <span className={`text-lg font-medium ${textColor} group-hover:text-teal-400`}>
                {suggestion.title}
              </span>
            </div>
            <p className={`text-base ${mutedTextColor} line-clamp-2`}>
              {suggestion.prompt}
            </p>
          </button>
        ))}
      </div>

      {/* Bottom hint */}
      <p className={`mt-10 text-center text-base ${mutedTextColor}`}>
        Press <kbd className={`rounded ${kbdBg} px-2.5 py-1 text-sm font-mono`}>Enter</kbd> to send
      </p>
    </div>
  );
}
