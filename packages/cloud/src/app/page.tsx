"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import IslandIcon from "@/icons/IslandIcon";
import { useTopics } from "@/features/home/hooks/useTopics";
import { useAuth } from "@/features/auth/hooks/useAuth";
import UserMenu from "@/components/UserMenu";

const HomeCloud3D = dynamic(
  () => import("@/features/home/components/HomeCloud3D"),
  { ssr: false }
);

// Fallback topics if DB is empty
const CLOUD_WORDS = [
  { id: "1", text: "React", weight: 70, category: "Frontend" },
  { id: "2", text: "TypeScript", weight: 60, category: "Language" },
  { id: "3", text: "Next.js", weight: 50, category: "Frontend" },
  { id: "4", text: "Tailwind", weight: 60, category: "CSS" },
  { id: "5", text: "JavaScript", weight: 80, category: "Language" },
  { id: "6", text: "Python", weight: 70, category: "Language" },
  { id: "7", text: "Database", weight: 40, category: "Backend" },
  { id: "8", text: "API", weight: 40, category: "Backend" },
  { id: "9", text: "Three.js", weight: 50, category: "3D" },
  { id: "10", text: "AI", weight: 75, category: "Machine Learning" },
];

export default function Cloud() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { topics, loading, refetch } = useTopics();

  // Auto-process topics (existing logic)
  useEffect(() => {
    const autoProcess = async () => {
      if (isProcessing || loading || topics.length > 5) return;
      setIsProcessing(true);
      try {
        const response = await fetch("/api/batch-process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 5 }),
        });
        if (response.ok && refetch) refetch();
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    };
    const timer = setTimeout(autoProcess, 2000);
    return () => clearTimeout(timer);
  }, [loading, topics.length, isProcessing, refetch]);

  const displayTopics = topics.length > 0 ? topics : CLOUD_WORDS;

  const handleWordClick = (word: string) => {
    router.push(`/knowledge-graph?topic=${encodeURIComponent(word)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  return (
    <div className="relative w-screen h-screen bg-[#030712] overflow-hidden font-sans">
      {/* Immersive 3D Space */}
      <div className="absolute inset-0 z-0">
        <HomeCloud3D
          topics={displayTopics}
          onTopicClick={handleWordClick}
          activeSearch={activeSearch}
        />
      </div>

      {/* Glassmorphic Top Nav */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 pointer-events-none">
        <div className="flex items-center gap-10 pointer-events-auto">
          <button
            onClick={() => router.push("/mike/island")}
            className="text-white hover:text-purple-400 transition-all hover:scale-110"
          >
            <IslandIcon />
          </button>

          <nav className="flex gap-8 bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
            <a
              href="http://localhost:3003"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Search
            </a>
            <button className="text-white text-sm font-bold relative after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-px after:bg-white">
              Cloud
            </button>
            <button
              onClick={() => router.push("/explore")}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Explore
            </button>
          </nav>
        </div>

        <div className="pointer-events-auto">
          {user ? (
            <UserMenu name={user.name} email={user.email} />
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-white text-black font-bold rounded-full text-sm hover:bg-purple-100 transition-all"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Floating Status Indicator */}
      {isProcessing && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-3 px-6 py-3 bg-purple-500/10 backdrop-blur-md rounded-full border border-purple-500/20">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400" />
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">
              Synthesizing Wisdom...
            </span>
          </div>
        </div>
      )}

      {/* Search HUD */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10">
        <div className="flex flex-col items-center gap-6">
          {activeSearch && (
            <div className="bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 text-[10px] uppercase font-bold tracking-widest text-purple-400">
              Filtering: {activeSearch}
            </div>
          )}

          <form onSubmit={handleSearch} className="w-full relative group">
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl group-focused-within:bg-purple-500/40 transition-all" />
            <div className="relative flex items-center bg-white/[0.03] backdrop-blur-3xl rounded-[32px] border border-white/10 px-8 py-5 shadow-2xl transition-all focus-within:border-white/30">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Traverse the wisdom cloud..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg font-light tracking-wide"
              />
              <button
                type="submit"
                className="text-gray-400 hover:text-white transition-colors ml-4"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Interaction Hints */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 scale-75 origin-bottom-left">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-[10px] text-gray-400 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 flex items-center justify-center bg-white/10 rounded">
              🖱️
            </span>
            <span>
              <b>Drag:</b> Traverse Space
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 flex items-center justify-center bg-white/10 rounded">
              🔍
            </span>
            <span>
              <b>Scroll:</b> Smooth Zoom
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 flex items-center justify-center bg-white/10 rounded">
              🎯
            </span>
            <span>
              <b>Click Word:</b> Analyze Topic
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
