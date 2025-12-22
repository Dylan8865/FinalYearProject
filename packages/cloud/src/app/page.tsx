"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import IslandIcon from "@/icons/IslandIcon";
import TagCanvas3D from "@/features/cloud/components/TagCanvas3D";
import { useTopics } from "@/features/cloud/hooks/useTopics";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

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
 * Cloud Page - Interactive 3D word cloud exploration
 * Allows users to discover content by clicking on trending topics
 */
export default function Cloud() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Fetch topics from database
  const { topics, words, loading, error, refetch } = useTopics();

  // Auto-process item-data records when cache is empty
  useEffect(() => {
    const autoProcess = async () => {
      // Only run if not already processing and cache appears empty/small
      if (isProcessing || loading || words.length > 10) return;

      console.log('🤖 Auto-processing: Checking for unprocessed data...');
      setIsProcessing(true);

      try {
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch('/api/batch-process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: 5, offset }),
          });

          if (!response.ok) break;

          const data = await response.json();
          console.log(`✅ Processed batch: ${data.successful} successful, ${data.errors} errors`);

          hasMore = data.hasMore;
          offset = data.nextOffset;

          // Refresh topics after each batch
          if (refetch) refetch();

          // Wait 3 seconds between batches (rate limiting)
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        console.log('🎉 Auto-processing completed!');
      } catch (error) {
        console.error('❌ Auto-processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    // Run auto-process after initial load
    const timer = setTimeout(autoProcess, 2000);
    return () => clearTimeout(timer);
  }, [loading, words.length, isProcessing, refetch]);

  // Use database words if available, otherwise fallback
  const cloudWords = words.length > 0 ? words : CLOUD_WORDS;

  // Filter words based on search query
  const filteredWords = activeSearch
    ? cloudWords.filter((word) =>
        word.text.toLowerCase().includes(activeSearch.toLowerCase())
      )
    : cloudWords;

  const handleWordClick = (word: string) => {
    // Navigate to knowledge graph with selected topic
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // The useAuth hook will automatically detect the sign out
    // No need to redirect, the UI will update automatically
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Auto-Processing Status Indicator */}
      {isProcessing && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 bg-blue-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          <span className="text-sm font-medium">Processing topics with AI...</span>
        </div>
      )}

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
            <a
              href="http://localhost:3003"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Search
            </a>
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

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">
              {user.email}
            </span>
            <button
              onClick={() => router.push("/favorites")}
              className="text-white hover:text-gray-300 transition-colors"
            >
              ⭐ Favorites
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="text-white hover:text-gray-300 transition-colors"
          >
            Sign in
          </button>
        )}
      </header>

      {/* 3D Word Cloud */}
      <div className="absolute inset-0 flex items-center justify-center pt-16 px-4">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
            <p className="text-gray-400">Loading topics...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="text-yellow-400">Using offline data</p>
            <TagCanvas3D
              words={filteredWords}
              width={window.innerWidth - 32}
              height={800}
              onWordClick={handleWordClick}
              options={{
                textHeight: 16,
                maxSpeed: 0.04,
                depth: 0.8,
                radiusX: 1.2,
                radiusY: 0.95,
                radiusZ: 0.95,
                zoom: 0.9,
              }}
              className="w-full"
            />
          </div>
        ) : (
          <TagCanvas3D
            words={filteredWords}
            width={window.innerWidth - 32}
            height={800}
            onWordClick={handleWordClick}
            options={{
              textHeight: 16,
              maxSpeed: 0.04,
              depth: 0.8,
              radiusX: 1.2,
              radiusY: 0.95,
              radiusZ: 0.95,
              zoom: 0.9,
            }}
            className="w-full"
          />
        )}
      </div>

      {/* Search Results Count */}
      {activeSearch && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center z-10">
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
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
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

      {/* Instructions hint */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm text-center">
        <p>Drag to rotate • Click a word to explore • Scroll to zoom</p>
      </div>
    </div>
  );
}
