"use client";

import { useState, useEffect } from "react";
import { ItemType } from "@/types/types";

export function useItems() {
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/items");

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }

      const data: ItemType[] = await response.json();
      setItems(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch items:", err);
    } finally {
      setLoading(false);
    }
  };

  const getItemById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/items?id=${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch item");
      }

      const data: ItemType = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch item:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    getItemById,
  };
}
