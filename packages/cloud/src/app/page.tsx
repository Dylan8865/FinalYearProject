"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import IslandIcon from "@/features/island/icons/IslandIcon";

// Word cloud data with different sizes and positions
const CLOUD_WORDS = [
  { text: "React", size: 64, x: 20, y: 30, weight: 700 },
  { text: "TypeScript", size: 56, x: 60, y: 25, weight: 600 },
  { text: "Next.js", size: 48, x: 35, y: 50, weight: 500 },
  { text: "Tailwind", size: 52, x: 75, y: 45, weight: 600 },
  { text: "JavaScript", size: 72, x: 45, y: 15, weight: 800 },
  { text: "Node.js", size: 44, x: 15, y: 65, weight: 500 },
  { text: "Python", size: 60, x: 80, y: 70, weight: 700 },
  { text: "Database", size: 40, x: 25, y: 80, weight: 400 },
  { text: "API", size: 36, x: 65, y: 60, weight: 400 },
  { text: "CSS", size: 42, x: 50, y: 75, weight: 450 },
  { text: "HTML", size: 38, x: 10, y: 45, weight: 400 },
  { text: "Git", size: 34, x: 55, y: 40, weight: 350 },
  { text: "Docker", size: 46, x: 85, y: 35, weight: 500 },
  { text: "Kubernetes", size: 40, x: 30, y: 20, weight: 450 },
  { text: "AWS", size: 50, x: 70, y: 55, weight: 550 },
  { text: "Azure", size: 44, x: 40, y: 70, weight: 500 },
  { text: "GraphQL", size: 38, x: 90, y: 50, weight: 400 },
  { text: "REST", size: 36, x: 20, y: 55, weight: 350 },
  { text: "MongoDB", size: 42, x: 60, y: 80, weight: 450 },
  { text: "PostgreSQL", size: 40, x: 75, y: 20, weight: 450 },
  { text: "Redis", size: 32, x: 50, y: 35, weight: 300 },
  { text: "Testing", size: 36, x: 15, y: 25, weight: 350 },
  { text: "CI/CD", size: 34, x: 85, y: 60, weight: 350 },
  { text: "Agile", size: 32, x: 35, y: 85, weight: 300 },
  { text: "DevOps", size: 44, x: 65, y: 15, weight: 500 },
  { text: "Microservices", size: 40, x: 25, y: 40, weight: 450 },
  { text: "Serverless", size: 38, x: 80, y: 80, weight: 400 },
  { text: "WebSocket", size: 34, x: 45, y: 60, weight: 350 },
  { text: "OAuth", size: 32, x: 55, y: 85, weight: 300 },
  { text: "JWT", size: 30, x: 10, y: 70, weight: 300 },
  { text: "Webpack", size: 36, x: 70, y: 40, weight: 350 },
  { text: "Vite", size: 38, x: 90, y: 25, weight: 400 },
  { text: "Redux", size: 40, x: 30, y: 60, weight: 450 },
  { text: "Three.js", size: 46, x: 50, y: 50, weight: 500 },
  { text: "WebGL", size: 42, x: 15, y: 15, weight: 450 },
  { text: "AI", size: 68, x: 40, y: 35, weight: 750 },
  { text: "Machine Learning", size: 48, x: 75, y: 65, weight: 550 },
  { text: "Blockchain", size: 44, x: 20, y: 75, weight: 500 },
  { text: "Web3", size: 50, x: 85, y: 15, weight: 550 },
  { text: "Cloud", size: 54, x: 60, y: 70, weight: 600 },
  { text: "Security", size: 46, x: 35, y: 25, weight: 500 },
];

/**
 * Cloud Page - Interactive word cloud exploration
 * Allows users to discover content by clicking on trending topics
 */
export default function Cloud() {
  const router = useRouter();
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [activeSearch, setActiveSearch] = useState("");

  // Filter words based on search query
  const filteredWords = activeSearch
    ? CLOUD_WORDS.filter((word) =>
        word.text.toLowerCase().includes(activeSearch.toLowerCase())
      )
    : CLOUD_WORDS;

  // Check if a word matches the search
  const isMatchingWord = (text: string) => {
    if (!activeSearch) return false;
    return text.toLowerCase().includes(activeSearch.toLowerCase());
  };

  const handleWordClick = (word: string) => {
    setClickedWord(word);
    setTimeout(() => {
      router.push(`/explore?q=${encodeURIComponent(word)}`);
    }, 200);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Apply the search filter on the cloud page
    setActiveSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-8">
          {/* Island Icon - Links to Island Game Page */}
          <button
            onClick={() => router.push("/mike/island")}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <IslandIcon />
          </button>

          <nav className="flex gap-6">
            <button
              onClick={() => router.push("/home")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Search
            </button>
            <button className="text-white font-medium border-b-2 border-white">
              Cloud
            </button>
            <button
              onClick={() => router.push("/explore")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Explore
            </button>
          </nav>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="text-white hover:text-gray-300 transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Word Cloud */}
      <div className="absolute inset-0 flex items-center justify-center">
        {CLOUD_WORDS.map((word, index) => {
          const isHovered = hoveredWord === word.text;
          const isClicked = clickedWord === word.text;
          const isOtherHovered = hoveredWord && hoveredWord !== word.text;
          const isMatching = isMatchingWord(word.text);
          const isFiltered = activeSearch && !isMatching;

          return (
            <button
              key={index}
              onClick={() => handleWordClick(word.text)}
              onMouseEnter={() => setHoveredWord(word.text)}
              onMouseLeave={() => setHoveredWord(null)}
              className={`absolute transition-all duration-500 ease-out hover:z-10 cursor-pointer select-none ${
                isFiltered ? "pointer-events-none" : ""
              }`}
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                fontSize: `${word.size}px`,
                fontWeight: word.weight,
                transform: isClicked
                  ? "scale(0.95)"
                  : isHovered
                  ? "scale(1.15)"
                  : isMatching
                  ? "scale(1.2)"
                  : "scale(1)",
                color: isClicked
                  ? "#3b82f6"
                  : isMatching
                  ? "#22c55e"
                  : isHovered
                  ? "#60a5fa"
                  : "white",
                opacity: isFiltered ? 0.1 : isOtherHovered ? 0.3 : 1,
                textShadow: isMatching
                  ? "0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.5)"
                  : isHovered
                  ? "0 0 20px rgba(96, 165, 250, 0.5), 0 0 40px rgba(96, 165, 250, 0.3)"
                  : "none",
                filter: isHovered || isMatching ? "brightness(1.2)" : "none",
              }}
            >
              {word.text}
            </button>
          );
        })}
      </div>

      {/* Search Results Count */}
      {activeSearch && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-gray-300 text-lg">
            Found <span className="text-green-400 font-bold">{filteredWords.length}</span> matching topics for &quot;{activeSearch}&quot;
          </p>
          <button
            onClick={handleClearSearch}
            className="mt-2 text-gray-400 hover:text-white text-sm underline transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-6 py-4 shadow-2xl">
            <svg
              className="w-5 h-5 text-gray-400 mr-3"
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics in the cloud..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="ml-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Footer hint */}
      {hoveredWord && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm">
          Click to explore &quot;{hoveredWord}&quot;
        </div>
      )}
    </div>
  );
}
