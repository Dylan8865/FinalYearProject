"use client";

import React, { useState } from "react";
import { CloudWord } from "@/types/types";

interface WordCloudProps {
  words: CloudWord[];
  onWordClick: (word: string) => void;
  activeSearch?: string;
}

/**
 * WordCloud Component - Renders interactive word cloud
 */
export default function WordCloud({
  words,
  onWordClick,
  activeSearch = "",
}: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [clickedWord, setClickedWord] = useState<string | null>(null);

  const isMatchingWord = (text: string) => {
    if (!activeSearch) return false;
    return text.toLowerCase().includes(activeSearch.toLowerCase());
  };

  const handleWordClick = (word: string) => {
    setClickedWord(word);
    setTimeout(() => {
      onWordClick(word);
    }, 200);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {words.map((word, index) => {
        const isHovered = hoveredWord === word.text;
        const isClicked = clickedWord === word.text;
        const isOtherHovered = hoveredWord && hoveredWord !== word.text;
        const isMatching = isMatchingWord(word.text);
        const isFiltered = activeSearch && !isMatching;

        return (
          <button
            key={word.id || index}
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
  );
}
