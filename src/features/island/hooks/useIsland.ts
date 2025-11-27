import { useState, useEffect } from "react";
import { IslandData } from "../components/IslandCanvas";
import { mapIslandsToCanvas, DBIsland } from "../utils/mapIslandsToCanvas";

export function useIslands() {
  const [islands, setIslands] = useState<IslandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIslands = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/islands");

      if (!response.ok) {
        throw new Error("Failed to fetch islands");
      }

      const dbIslands: DBIsland[] = await response.json();
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
    level: number = 1,
    theme: string = "grass"
  ) => {
    try {
      const response = await fetch("/api/islands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, level, theme }),
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

  useEffect(() => {
    fetchIslands();
  }, []);

  return {
    islands,
    loading,
    error,
    refetch: fetchIslands,
    createIsland,
  };
}
