"use client";

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
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
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      {/* Logo / Title */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
            <svg
              className="h-10 w-10 text-white"
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
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Wisdom Search</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Ask me anything about Wisdom Island
        </p>
      </div>

      {/* Suggestions Grid */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="group flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{suggestion.icon}</span>
              <span className="font-medium text-foreground group-hover:text-primary">
                {suggestion.title}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {suggestion.prompt}
            </p>
          </button>
        ))}
      </div>

      {/* Bottom hint */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Press <kbd className="rounded bg-muted px-2 py-0.5 text-xs font-mono">Enter</kbd> to send • <kbd className="rounded bg-muted px-2 py-0.5 text-xs font-mono">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
