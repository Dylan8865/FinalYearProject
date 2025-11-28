import { useState, useEffect } from "react";
import { IslandItemType } from "@/types/types";

export function useIslandItems(userId?: string, islandId?: string) {
  const [islandItems, setIslandItems] = useState<IslandItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIslandItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append("user_id", userId);
      if (islandId) params.append("island_id", islandId);

      const response = await fetch(`/api/island_items?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch island items");
      }

      const data: IslandItemType[] = await response.json();
      setIslandItems(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch island items:", err);
    } finally {
      setLoading(false);
    }
  };

  const purchaseItem = async (itemId: string, userId: string) => {
    try {
      const response = await fetch("/api/island_items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: itemId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to purchase item");
      }

      await fetchIslandItems();
      return true;
    } catch (err) {
      console.error("Failed to purchase item:", err);
      return false;
    }
  };

  const placeItemOnIsland = async (
    islandItemId: string,
    islandId: string,
    gridX: number,
    gridY: number,
    gridZ: number
  ) => {
    try {
      const response = await fetch("/api/island_items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: islandItemId,
          island_id: islandId,
          grid_x: gridX,
          grid_y: gridY,
          grid_z: gridZ,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place item");
      }

      await fetchIslandItems();
      return true;
    } catch (err) {
      console.error("Failed to place item:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchIslandItems();
  }, [userId, islandId]);

  return {
    islandItems,
    loading,
    error,
    refetch: fetchIslandItems,
    purchaseItem,
    placeItemOnIsland,
  };
}
