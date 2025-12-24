"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useTheme } from "../context/ThemeContext";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

// Validation helpers
function validateQuery(query: string): { isValid: boolean; error: string | null; sanitized: string } {
  const trimmed = query.trim();
  
  // Check for empty query
  if (!trimmed) {
    return { isValid: false, error: "Please enter a search query to begin.", sanitized: "" };
  }
  
  return { isValid: true, error: null, sanitized: trimmed };
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark = theme === "dark";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const mutedTextColor = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-gray-600" : "border-gray-400";
  const placeholderColor = isDark ? "placeholder:text-gray-500" : "placeholder:text-gray-400";
  const errorBorderColor = "border-red-500";

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [input]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error && input.trim()) {
      setError(null);
    }
  }, [input, error]);

  const handleSubmit = () => {
    if (isLoading) return;
    
    const validation = validateQuery(input);
    
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    
    onSend(validation.sanitized);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <div className={`relative flex items-center gap-4 rounded-full border ${error ? errorBorderColor : borderColor} bg-transparent px-6 py-3 transition-colors focus-within:border-teal-400`}>
        {/* Search Icon */}
        <svg
          className={`h-6 w-6 shrink-0 ${mutedTextColor}`}
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

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question..."
          rows={1}
          className={`max-h-[200px] min-h-[28px] flex-1 resize-none bg-transparent text-lg ${textColor} outline-none ${placeholderColor}`}
          disabled={isLoading}
        />

        {/* Send button */}
        {input.trim() && (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="shrink-0 text-teal-400 transition-colors hover:text-teal-300 disabled:opacity-50"
            title="Send message"
          >
          {isLoading ? (
            <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
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
          )}
        </button>
      )}
      </div>
    </div>
  );
}
