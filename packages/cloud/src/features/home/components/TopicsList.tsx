"use client";

import React from "react";
import { TopicSummary } from "@/features/home/hooks/useTopicExtraction";

interface TopicsListProps {
  topics: TopicSummary[];
  loading: boolean;
  onTopicClick: (topicId: string, topicName: string) => void;
}

/**
 * Topics List Component
 *
 * Displays all extracted main topics as simple clickable text items.
 * When a user clicks on a topic, it switches to the Bubble Map view.
 */
export default function TopicsList({
  topics,
  loading,
  onTopicClick,
}: TopicsListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-6 bg-gray-700/50 rounded animate-pulse w-48"
          />
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-xl mb-2">No topics found</p>
        <p className="text-sm">Topics will appear here after extraction</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-6 bg-gray-800/50">
      {topics.map((topic) => (
        <button
          key={topic.id}
          onClick={() => onTopicClick(topic.id, topic.main_topic)}
          className="text-left py-2 px-3 text-white hover:text-gray-300 transition-colors"
        >
          <span className="text-base">{topic.main_topic}</span>
          <span className="text-gray-500 text-sm ml-2">
            ({topic.sub_topic_count})
          </span>
        </button>
      ))}
    </div>
  );
}
