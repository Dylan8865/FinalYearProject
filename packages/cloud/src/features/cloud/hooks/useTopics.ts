"use client";

import { useState, useEffect, useCallback } from "react";
import { CloudWord3D } from "../components/TagCanvas3D";

// Type for AI-extracted topic from item-data
export interface CloudTopic {
  id: string;
  text: string;
  weight: number;
  category: string;
}

/**
 * useTopics Hook
 * 
 * Fetches AI-extracted topics from item-data table (via /api/topics)
 * Data flow: item-data (Supabase) → AI Processing (Gemini) → CloudPage (Frontend)
 */
export function useTopics() {
  const [topics, setTopics] = useState<CloudTopic[]>([]);
  const [words, setWords] = useState<CloudWord3D[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/topics");

      if (!response.ok) {
        throw new Error("Failed to fetch topics");
      }

      const data: CloudTopic[] = await response.json();
      setTopics(data);

      // Transform to CloudWord3D format for TagCanvas
      const cloudWords: CloudWord3D[] = data.map((topic) => ({
        text: topic.text,
        weight: topic.weight,
      }));
      setWords(cloudWords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch topics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Track topic clicks (local only, no database)
  const incrementClickCount = useCallback(
    (id: string) => {
      const topic = topics.find((t) => t.id === id);
      if (topic) {
        console.log(`Topic "${topic.text}" clicked`);
      }
    },
    [topics]
  );

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return {
    topics,        // AI-extracted topics from item-data
    words,         // Transformed for TagCanvas3D
    loading,
    error,
    refetch: fetchTopics,
    incrementClickCount,
  };
}
