"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import IslandIcon from "@/icons/IslandIcon";
import { useTopics } from "@/features/cloud/hooks/useTopics";

// Dynamically import TagCanvas3D to avoid SSR issues
const TagCanvas3D = dynamic(
  () => import("@/features/cloud/components/TagCanvas3D"),
  { ssr: false }
);

// Fallback data when database is unavailable (weight: 1-100 scale)
const FALLBACK_WORDS = [
  { text: "React", weight: 85 },
  { text: "TypeScript", weight: 80 },
  { text: "Next.js", weight: 75 },
  { text: "Tailwind", weight: 78 },
  { text: "JavaScript", weight: 95 },
  { text: "Node.js", weight: 70 },
  { text: "Python", weight: 88 },
  { text: "Database", weight: 55 },
  { text: "API", weight: 60 },
  { text: "CSS", weight: 65 },
  { text: "HTML", weight: 58 },
  { text: "Git", weight: 50 },
  { text: "Docker", weight: 72 },
  { text: "Kubernetes", weight: 68 },
  { text: "AWS", weight: 75 },
  { text: "Azure", weight: 70 },
  { text: "GraphQL", weight: 62 },
  { text: "REST", weight: 55 },
  { text: "MongoDB", weight: 65 },
  { text: "PostgreSQL", weight: 68 },
  { text: "Redis", weight: 48 },
  { text: "Testing", weight: 52 },
  { text: "CI/CD", weight: 58 },
  { text: "Agile", weight: 45 },
  { text: "DevOps", weight: 72 },
  { text: "Microservices", weight: 65 },
  { text: "Serverless", weight: 60 },
  { text: "WebSocket", weight: 52 },
  { text: "OAuth", weight: 48 },
  { text: "JWT", weight: 45 },
  { text: "Webpack", weight: 55 },
  { text: "Vite", weight: 62 },
  { text: "Redux", weight: 65 },
  { text: "Three.js", weight: 70 },
  { text: "WebGL", weight: 65 },
  { text: "AI", weight: 92 },
  { text: "Machine Learning", weight: 78 },
  { text: "Blockchain", weight: 68 },
  { text: "Web3", weight: 72 },
  { text: "Cloud", weight: 82 },
  { text: "Security", weight: 70 },
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
  const cloudWords = words.length > 0 ? words : FALLBACK_WORDS;

  // Filter words based on search query
  const filteredWords = activeSearch
    ? cloudWords.filter((word) =>
        word.text.toLowerCase().includes(activeSearch.toLowerCase())
      )
    : cloudWords;

  const handleWordClick = (word: string) => {
    console.log('🎯 Word clicked:', word);
    
    // Find the topic details
    const topic = topics.find(t => t.text === word);
    
    if (topic) {
      // Navigate to knowledge graph with selected topic
      router.push(`/knowledge-graph?topic=${encodeURIComponent(topic.id)}`);
    } else {
      // Fallback: navigate to knowledge graph without selection
      router.push('/knowledge-graph');
    }
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
            <button
              onClick={() => router.push("/")}
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

      {/* 3D Word Cloud */}
      <div className="absolute inset-0 flex items-center justify-center pt-16">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
            <p className="text-gray-400">Loading topics...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-yellow-400">Using offline data</p>
            <TagCanvas3D
              words={filteredWords}
              width={700}
              height={700}
              onWordClick={handleWordClick}
              options={{
                textHeight: 20,
                maxSpeed: 0.03,
                depth: 0.75,
                outlineColour: "transparent",
                outlineThickness: 0,
              }}
            />
          </div>
        ) : (
          <TagCanvas3D
            words={filteredWords}
            width={700}
            height={700}
            onWordClick={handleWordClick}
            options={{
              textHeight: 20,
              maxSpeed: 0.03,
              depth: 0.75,
              outlineColour: "transparent",
              outlineThickness: 0,
            }}
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
