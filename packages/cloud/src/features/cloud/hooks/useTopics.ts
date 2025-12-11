"use client";

import { useState, useEffect, useCallback } from "react";
import { CloudWord3D } from "../components/TagCanvas3D";

// Type for the database topic
export interface CloudTopic {
  id: string;
  text: string;
  weight: number;
  category: string | null;
  trending: boolean;
  created_at: string;
  updated_at: string;
}

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

  const createTopic = useCallback(
    async (newTopic: { text: string; weight?: number; category?: string; trending?: boolean }) => {
      try {
        const response = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTopic),
        });

        if (!response.ok) {
          throw new Error("Failed to create topic");
        }

        const created = await response.json();
        await fetchTopics(); // Refresh the list
        return created;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchTopics]
  );

  const updateTopic = useCallback(
    async (id: string, updates: Partial<CloudTopic>) => {
      try {
        const response = await fetch("/api/topics", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...updates }),
        });

        if (!response.ok) {
          throw new Error("Failed to update topic");
        }

        const updated = await response.json();
        await fetchTopics(); // Refresh the list
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchTopics]
  );

  const deleteTopic = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/topics?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete topic");
        }

        await fetchTopics(); // Refresh the list
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchTopics]
  );

  // Increment click count (for tracking popular topics)
  const incrementClickCount = useCallback(
    async (id: string) => {
      const topic = topics.find((t) => t.id === id);
      if (topic) {
        // You could add a click_count column and update it here
        console.log(`Topic "${topic.text}" clicked`);
      }
    },
    [topics]
  );

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return {
    topics,        // Raw database topics
    words,         // Transformed for TagCanvas3D
    loading,
    error,
    refetch: fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    incrementClickCount,
  };
}
