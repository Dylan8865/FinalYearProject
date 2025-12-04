"use client";

import { useState, useEffect } from "react";
import { IslandItemType } from "@/types/types";

export function useIslandItems(profileId?: string, islandId?: string) {
  const [islandItems, setIslandItems] = useState<IslandItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIslandItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (profileId) params.append("profile_id", profileId);
      if (islandId) params.append("island_id", islandId);

      const response = await fetch(`/api/island-items?${params.toString()}`);

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

  const purchaseItem = async (itemId: string, profileId: string) => {
    try {
      const response = await fetch("/api/island-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: 1,
          item_id: itemId,
          profile_id: profileId,
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
      const response = await fetch("/api/island-items", {
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

  const updateItemPosition = async (
    islandItemId: string,
    posX: number,
    posY: number
  ) => {
    // Optimistic update - update UI immediately
    setIslandItems((prevItems) =>
      prevItems.map((item) =>
        item.id === islandItemId ? { ...item, pos_x: posX, pos_y: posY } : item
      )
    );

    // Update database in background
    try {
      const response = await fetch("/api/island-items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: islandItemId,
          pos_x: posX,
          pos_y: posY,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item position");
      }

      return true;
    } catch (err) {
      console.error("Failed to update item position:", err);
      // Revert optimistic update on error
      await fetchIslandItems();
      return false;
    }
  };

  const deleteItem = async (islandItemId: string) => {
    // Optimistic update - remove from UI immediately
    setIslandItems((prevItems) =>
      prevItems.filter((item) => item.id !== islandItemId)
    );

    // Delete from database in background
    try {
      const response = await fetch(`/api/island-items?id=${islandItemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      return true;
    } catch (err) {
      console.error("Failed to delete item:", err);
      // Revert optimistic update on error
      await fetchIslandItems();
      return false;
    }
  };

  useEffect(() => {
    fetchIslandItems();
  }, [profileId, islandId]);

  return {
    islandItems,
    loading,
    error,
    refetch: fetchIslandItems,
    purchaseItem,
    placeItemOnIsland,
    updateItemPosition,
    deleteItem,
  };
}
