"use client";

import React, { useState, useMemo } from "react";
import {
  HomeProvider,
  useHomeContext,
} from "@/features/home/contexts/HomeContext";

import TagCanvas3D from "./TagCanvas3D";
import SearchBar from "./SearchBar";

interface CloudPageProps {
  className?: string;
}

// Inner component that uses the context
function CloudContent({ className }: CloudPageProps) {
  const { words, loading, error } = useHomeContext();

  const [searchValue, setSearchValue] = useState("");

  // Filter words based on search
  const filteredWords = useMemo(() => {
    if (!searchValue.trim()) return words;
    const search = searchValue.toLowerCase();
    return words.filter((word) => word.text.toLowerCase().includes(search));
  }, [words, searchValue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already filtering in real-time
    console.log("Search submitted:", searchValue);
  };

  const handleClear = () => {
    setSearchValue("");
  };

  return (
    <div className={`relative w-full h-full min-h-screen ${className || ""}`}>
      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={handleSearchSubmit}
          onClear={handleClear}
          placeholder="Search topics..."
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60">Loading topics...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-400">Error: {error}</div>
        </div>
      )}

      {/* 3D Word Cloud */}
      {!loading && !error && filteredWords.length > 0 && (
        <div className="w-full h-full">
          <TagCanvas3D
            words={filteredWords}
            onWordClick={(word) => console.log("Clicked:", word)}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && words.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60">No topics found</div>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && words.length > 0 && filteredWords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60">No topics match "{searchValue}"</div>
        </div>
      )}
    </div>
  );
}

export default function CloudPage({ className }: CloudPageProps) {
  return (
    <HomeProvider>
      <CloudContent className={className} />
    </HomeProvider>
  );
}
