"use client";

import React, { useEffect, useState } from "react";
import { useTopicExtraction } from "@/features/cloud/hooks/useTopicExtraction";
import TopicsList from "./TopicsList";
import BubbleMap from "./BubbleMap";

/**
 * TopicExplorer Component
 *
 * Main component for the topic exploration feature.
 *
 * Flow:
 * 1. On load: Fetch all extracted topics from item-data
 * 2. Display topics as clickable cards (TopicsList)
 * 3. On topic click: Switch to Bubble Map view
 * 4. Bubble Map shows main topic + sub-topics with 360° interaction
 */
export default function TopicExplorer() {
  const {
    topics,
    bubbleMaps,
    selectedTopic,
    loading,
    error,
    fetchExtractedTopics,
    generateSubTopics,
    selectTopic,
    clearSelection,
  } = useTopicExtraction();

  // Search/input for custom topic generation
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch topics on mount
  useEffect(() => {
    fetchExtractedTopics();
  }, [fetchExtractedTopics]);

  // Handle topic card click
  const handleTopicClick = (topicId: string, topicName: string) => {
    selectTopic(topicId);
  };

  // Handle custom topic generation
  const handleGenerateCustom = async () => {
    if (!customTopic.trim()) return;

    setIsGenerating(true);
    await generateSubTopics(customTopic);
    setIsGenerating(false);
  };

  // Handle node click in bubble map
  const handleNodeClick = (node: { id: string; name: string; type: string }) => {
    if (node.type === "sub") {
      // Optionally generate sub-topics for the clicked sub-topic
      console.log("Clicked sub-topic:", node.name);
    }
  };

  // View: Bubble Map
  if (selectedTopic) {
    return (
      <div className="w-full h-screen">
        <BubbleMap
          mainTopic={selectedTopic.main_topic}
          category={selectedTopic.category}
          nodes={selectedTopic.nodes}
          links={selectedTopic.links}
          onNodeClick={handleNodeClick}
          onBack={clearSelection}
        />
      </div>
    );
  }

  // View: Topics List
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-3xl font-bold text-white mb-2">Topic Explorer</h1>
        <p className="text-white/60">
          Click on a topic to view its bubble map with related sub-topics
        </p>
      </div>

      {/* Custom Topic Generator */}
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-2 max-w-xl">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateCustom()}
            placeholder="Enter a topic to generate sub-topics..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handleGenerateCustom}
            disabled={isGenerating || !customTopic.trim()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg text-white font-medium transition-colors"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mx-4 mt-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Topics Grid */}
      <TopicsList
        topics={topics}
        loading={loading}
        onTopicClick={handleTopicClick}
      />

      {/* Empty State */}
      {!loading && topics.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h2 className="text-xl text-white mb-2">No Topics Yet</h2>
          <p className="text-white/60 mb-4 max-w-md">
            Topics will be extracted from your item-data automatically.
            Or enter a custom topic above to generate a bubble map.
          </p>
        </div>
      )}
    </div>
  );
}
