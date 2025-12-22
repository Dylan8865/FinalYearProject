"use client";

import { useState, useEffect } from "react";
import { mapIslandsToCanvas } from "@/utils/mapIslandsToCanvas";
import { IslandTypeWithPosition, IslandType } from "@/types/types";

export function useIslands() {
  const [islands, setIslands] = useState<IslandTypeWithPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIslands = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/islands", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Failed to fetch islands");
      }

      const dbIslands: IslandType[] = await response.json();
      const mappedIslands = mapIslandsToCanvas(dbIslands, 8);

      setIslands(mappedIslands);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch islands:", err);
    } finally {
      setLoading(false);
    }
  };

  const createIsland = async (
    name: string,
    description: string,
    theme: string,
    level: number = 1
  ) => {
    try {
      const response = await fetch("/api/islands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, theme, level }),
      });

      if (!response.ok) {
        throw new Error("Failed to create island");
      }

      await fetchIslands();
      return true;
    } catch (err) {
      console.error("Failed to create island:", err);
      return false;
    }
  };

  const updateIsland = async (
    id: string,
    updates: {
      name?: string;
      description?: string;
      theme?: string;
      level?: number;
    }
  ) => {
    try {
      const response = await fetch("/api/islands", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to update island");
      }

      await fetchIslands();
      return true;
    } catch (err) {
      console.error("Failed to update island:", err);
      return false;
    }
  };

  const upgradeIsland = async (id: string, level: number, cost: number) => {
    try {
      const response = await fetch("/api/islands/upgrade", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, level, cost }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to upgrade island");
      }

      await fetchIslands();
      return true;
    } catch (err) {
      console.error("Failed to upgrade island:", err);
      return false;
    }
  };

  const deleteIsland = async (id: string) => {
    try {
      const response = await fetch(`/api/islands?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete island");
      }

      await fetchIslands();
      return true;
    } catch (err) {
      console.error("Failed to delete island:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchIslands();
  }, []);

  return {
    islands,
    loading,
    error,
    refetch: fetchIslands,
    createIsland,
    updateIsland,
    upgradeIsland,
    deleteIsland,
  };
}
