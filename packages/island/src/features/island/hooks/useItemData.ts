"use client";

import { useState, useEffect, useCallback } from "react";
import { ItemDataType } from "@/types/types";

/**
 * useItemData Hook
 *
 * Custom hook for fetching item-data associated with an island-item.
 *
 * @param islandItemId - The ID of the island-item to fetch data for
 * @returns Object with data, loading state, error, and refetch function
 */
export function useItemData(islandItemId: string | null | undefined) {
  const [data, setData] = useState<ItemDataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItemData = useCallback(async () => {
    if (!islandItemId) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/item-data?island_item_id=${islandItemId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch item data");
      }

      const result: ItemDataType[] = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch item data:", err);
    } finally {
      setLoading(false);
    }
  }, [islandItemId]);

  useEffect(() => {
    fetchItemData();
  }, [fetchItemData]);

  return {
    data,
    loading,
    error,
    refetch: fetchItemData,
  };
}
