"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  HomeProvider,
  useHomeContext,
} from "@/features/home/contexts/HomeContext";
import SearchBar from "./SearchBar";

const HomeCloud3D = dynamic(() => import("./HomeCloud3D"), { ssr: false });

interface CloudPageProps {
  className?: string;
}

// Inner component that uses the context
function CloudContent({ className }: CloudPageProps) {
  const router = useRouter();
  const { topics, loading, error } = useHomeContext();

  const [searchValue, setSearchValue] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);

  // Filter topics based on search
  const filteredTopics = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    if (!search) return [];
    return topics.filter((t) => t.text.toLowerCase().includes(search));
  }, [topics, searchValue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const search = searchValue.trim().toLowerCase();
    if (!search) return;

    const matches = topics.filter((t) => t.text.toLowerCase().includes(search));

    if (matches.length > 0) {
      const nextIndex = (matchIndex + 1) % matches.length;
      console.log(
        `🔍 Submission: Cycling to match ${nextIndex + 1} of ${matches.length}`
      );
      setMatchIndex(nextIndex);
    }
  };

  const handleClear = () => {
    setSearchValue("");
    setMatchIndex(0);
  };

  // Reset match index only when the trimmed search value changes
  useEffect(() => {
    setMatchIndex(0);
  }, [searchValue.trim()]);

  return (
    <div
      className={`relative w-full h-full min-h-screen bg-[#030712] ${
        className || ""
      }`}
    >
      {/* Immersive 3D Space */}
      <div className="absolute inset-0 z-0">
        {!loading && !error && (
          <HomeCloud3D
            topics={topics}
            onTopicClick={(word) =>
              router.push(`/knowledge-graph?topic=${encodeURIComponent(word)}`)
            }
            activeSearch={searchValue}
            searchMatchIndex={matchIndex}
          />
        )}
      </div>

      {/* Search Bar HUD */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={handleSearchSubmit}
          onClear={handleClear}
          placeholder="Explore the cloud..."
        />
      </div>

      {/* States Overlays */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#030712]/50 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            <div className="text-purple-300 text-xs font-bold uppercase tracking-widest">
              Synthesizing...
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-2xl backdrop-blur-md">
            <div className="text-red-400 text-sm">Error: {error}</div>
          </div>
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
