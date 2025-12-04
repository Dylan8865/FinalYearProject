"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

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
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const greeting = getGreeting();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (input.trim()) {
      onSuggestionClick(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col items-center justify-center px-4">
      {/* Greeting */}
      <h1 className="mb-8 text-4xl font-light text-white">{greeting}</h1>

      {/* Search Input */}
      <div className="w-full max-w-xl">
        <div className="relative flex items-center rounded-full border border-gray-600 bg-transparent px-4 py-3 transition-colors focus-within:border-teal-400">
          {/* Search Icon */}
          <svg
            className="mr-3 h-5 w-5 text-gray-400"
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
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to learn today?"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />

          {/* Submit button (appears when there's input) */}
          {input.trim() && (
            <button
              onClick={handleSubmit}
              className="ml-2 text-teal-400 hover:text-teal-300"
            >
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
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Grid */}
      <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-left transition-all hover:border-teal-500/50 hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{suggestion.icon}</span>
              <span className="font-medium text-white group-hover:text-teal-400">
                {suggestion.title}
              </span>
            </div>
            <p className="text-sm text-gray-400 line-clamp-2">
              {suggestion.prompt}
            </p>
          </button>
        ))}
      </div>

      {/* Bottom hint */}
      <p className="mt-8 text-center text-sm text-gray-500">
        Press <kbd className="rounded bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-400">Enter</kbd> to send
      </p>
    </div>
  );
}
