"use client";

import { useState, useEffect } from "react";
import { IslandItemType } from "@/types/types";
import { createClient } from "@/lib/supabase/client";

/**
 * useIslandItems Hook
 * 
 * Custom hook for managing island items (inventory and placed items).
 * Handles fetching, purchasing, placing, updating, and deleting items.
 * 
 * Features:
 * - Fetches items from island-item table with related item and island data
 * - Generates model URLs from Supabase storage (items bucket)
 * - Provides optimistic updates for better UX
 * - Handles database persistence through API routes
 * 
 * Model URLs:
 * - Models are stored in Supabase storage bucket "items"
 * - Filename format: {item_id}.glb
 * - Example: f612693e-b042-4a72-95f8-0736d7980a26.glb
 * 
 * @param profileId - Optional filter by profile ID
 * @param islandId - Optional filter by island ID (null = inventory items)
 * @returns Object with items, loading state, error, and CRUD functions
 */
export function useIslandItems(profileId?: string, islandId?: string) {
  const [islandItems, setIslandItems] = useState<IslandItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches island items from the database
   * Includes related item and island data
   * Computes quantity by grouping items with same item_id at same position
   */
  const fetchIslandItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (profileId) params.append("profile_id", profileId);
      if (islandId) params.append("island_id", islandId);

      // Fetch items from API (image URLs and model URLs are pre-resolved by the API)
      const response = await fetch(`/api/island-items?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch island items");
      }

      const data: IslandItemType[] = await response.json();

      // Group items by their position and item_id to compute quantities
      // Items with same item_id at same position (pos_x, pos_y) are stacked
      const groupedItems = new Map<string, IslandItemType[]>();

      data.forEach((item) => {
        // Create a key for grouping: "itemId-posX-posY" for inventory items
        // For placed items (on island), each gets unique key to not stack
        const isInventoryItem = item.island_id === null && item.grid_x === null;
        const key = isInventoryItem
          ? `${item.item_id}-${item.pos_x}-${item.pos_y}`
          : `placed-${item.id}`; // Placed items don't stack

        if (!groupedItems.has(key)) {
          groupedItems.set(key, []);
        }
        groupedItems.get(key)!.push(item);
      });

      // Convert grouped items back to array, keeping only the first item of each group
      // and adding a computed quantity property
      const itemsWithQuantity: IslandItemType[] = [];
      groupedItems.forEach((group) => {
        const firstItem = group[0];
        itemsWithQuantity.push({
          ...firstItem,
          quantity: group.length, // Computed quantity based on group size
        });
      });

      console.log("Fetched island items with computed quantities:", itemsWithQuantity);
      setIslandItems(itemsWithQuantity);
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
      // Always create a new item entry
      // Quantity will be computed client-side by grouping items with same item_id
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

      const newItem = await response.json();

      console.log("Purchased new item:", newItem);

      // Refetch to recompute quantities with the new item
      await fetchIslandItems();

      return true;
    } catch (err) {
      console.error("Failed to purchase item:", err);
      // Revert on error
      await fetchIslandItems();
      return false;
    }
  };

  /**
   * Places an item from inventory onto an island
   * 
   * Updates the island-item table with:
   * - island_id: Links item to specific island
   * - grid_x, grid_y, grid_z: 3D grid position
   * 
   * Uses optimistic updates for immediate UI feedback
   * 
   * @param islandItemId - ID of the island-item record
   * @param islandId - ID of the island to place item on
   * @param gridX - X coordinate on grid
   * @param gridY - Y coordinate on grid (vertical stacking)
   * @param gridZ - Z coordinate on grid
   * @returns Promise<boolean> - Success status
   */
  const placeItemOnIsland = async (
    islandItemId: string,
    islandId: string,
    gridX: number,
    gridY: number,
    gridZ: number
  ) => {
    // Optimistic update - Update UI immediately for better UX
    setIslandItems((prevItems) =>
      prevItems.map((item) =>
        item.id === islandItemId
          ? {
            ...item,
            island_id: islandId,
            grid_x: gridX,
            grid_y: gridY,
            grid_z: gridZ,
            pos_x: null,  // Clear inventory position
            pos_y: null,  // Clear inventory position
          }
          : item
      )
    );

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

      return true;
    } catch (err) {
      console.error("Failed to place item:", err);
      await fetchIslandItems();
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

  const removeItemFromIsland = async (
    islandItemId: string,
    profileId: string
  ) => {
    try {
      const itemToRemove = islandItems.find((item) => item.id === islandItemId);
      if (!itemToRemove) {
        console.error("Item not found:", islandItemId);
        return false;
      }

      const response = await fetch("/api/island-items/remove-from-island", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: islandItemId,
          profile_id: profileId,
          item_id: itemToRemove.item_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove item from island");
      }

      await fetchIslandItems();
      return true;
    } catch (err) {
      console.error("Failed to remove item from island:", err);
      await fetchIslandItems();
      return false;
    }
  };

  const moveToInventory = async (
    islandItemId: string,
    slotX: number,
    slotY: number
  ) => {
    try {
      // Optimistic update - move to inventory immediately
      setIslandItems((prevItems) =>
        prevItems.map((item) =>
          item.id === islandItemId
            ? {
              ...item,
              island_id: null,
              grid_x: null,
              grid_y: null,
              grid_z: null,
              pos_x: slotX,
              pos_y: slotY,
            }
            : item
        )
      );

      const response = await fetch("/api/island-items/move-to-inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: islandItemId,
          pos_x: slotX,
          pos_y: slotY,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to move item to inventory");
      }

      await fetchIslandItems();
      return true;
    } catch (err) {
      console.error("Failed to move item to inventory:", err);
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
    removeItemFromIsland,
    moveToInventory,
  };
}
