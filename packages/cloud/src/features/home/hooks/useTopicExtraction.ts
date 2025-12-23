"use client";

import { useState, useCallback } from "react";

export interface SubTopic {
  name: string;
  relevance: number;
  description?: string;
}

export interface TopicSummary {
  id: string;
  main_topic: string;
  category: string;
  sub_topic_count: number;
}

export interface BubbleNode {
  id: string;
  name: string;
  type: "main" | "sub";
  size: number;
  x: number;
  y: number;
  relevance?: number;
}

export interface BubbleLink {
  source: string;
  target: string;
  strength: number;
}

export interface BubbleMapData {
  main_topic: string;
  category: string;
  nodes: BubbleNode[];
  links: BubbleLink[];
}

export interface ExtractedTopicsResponse {
  topics: TopicSummary[];
  bubble_maps: BubbleMapData[];
}

export function useTopicExtraction() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [bubbleMaps, setBubbleMaps] = useState<BubbleMapData[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<BubbleMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all extracted topics from item-data
   */
  const fetchExtractedTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/topics/extract");

      if (!response.ok) {
        throw new Error("Failed to fetch extracted topics");
      }

      const data: ExtractedTopicsResponse = await response.json();
      setTopics(data.topics);
      setBubbleMaps(data.bubble_maps);

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Extract topic from custom content
   */
  const extractFromContent = useCallback(async (content: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/topics/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", content }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract topic");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate sub-topics for a specific topic
   */
  const generateSubTopics = useCallback(async (topic: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/topics/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_subtopics", topic }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate sub-topics");
      }

      const data = await response.json();

      // Set as selected topic for bubble map view
      if (data.bubble_map) {
        setSelectedTopic(data.bubble_map);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Select a topic to view in bubble map
   */
  const selectTopic = useCallback(
    (topicId: string) => {
      const bubbleMap = bubbleMaps.find(
        (_, index) => topics[index]?.id === topicId
      );
      if (bubbleMap) {
        setSelectedTopic(bubbleMap);
      }
    },
    [bubbleMaps, topics]
  );

  /**
   * Clear selected topic (go back to topic list)
   */
  const clearSelection = useCallback(() => {
    setSelectedTopic(null);
  }, []);

  return {
    // Data
    topics,
    bubbleMaps,
    selectedTopic,
    loading,
    error,

    // Actions
    fetchExtractedTopics,
    extractFromContent,
    generateSubTopics,
    selectTopic,
    clearSelection,
  };
}
