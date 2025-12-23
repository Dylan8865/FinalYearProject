"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Favorite item stored in localStorage
 * Stores both main topics and bubble maps
 */
export interface FavoriteItem {
  id: string; // Topic ID or bubble map ID
  type: "topic" | "bubblemap";
  name: string; // Topic name
  category?: string; // Topic category
  starredAt: string; // ISO timestamp
  bubbleMapData?: any; // Full bubble map data (if type is bubblemap)
}

const STORAGE_KEY = "cloud_favorites";

/**
 * useFavorites Hook
 *
 * No login required to view cloud.
 * Login required ONLY to save favorites.
 * Favorites stored in localStorage (client-side).
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session"); // You'll need this endpoint
      setIsLoggedIn(response.ok);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  // Load favorites from localStorage
  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: FavoriteItem[] = JSON.parse(stored);
        setFavorites(data);
      }
    } catch (err) {
      console.error("Failed to load favorites:", err);
      setError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((items: FavoriteItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setFavorites(items);
    } catch (err) {
      console.error("Failed to save favorites:", err);
      throw new Error("Failed to save favorites");
    }
  }, []);

  // Add topic to favorites
  const addFavoriteTopic = useCallback(
    (topicId: string, topicName: string, category?: string) => {
      if (!isLoggedIn) {
        setError("Please log in to save favorites");
        return false;
      }

      try {
        const newFav: FavoriteItem = {
          id: topicId,
          type: "topic",
          name: topicName,
          category,
          starredAt: new Date().toISOString(),
        };

        const updated = [...favorites, newFav];
        saveFavorites(updated);
        return true;
      } catch (err) {
        console.error("Failed to add favorite:", err);
        return false;
      }
    },
    [favorites, isLoggedIn, saveFavorites]
  );

  // Add bubble map to favorites
  const addFavoriteBubbleMap = useCallback(
    (bubbleMapId: string, bubbleMapName: string, bubbleMapData: any) => {
      if (!isLoggedIn) {
        setError("Please log in to save favorites");
        return false;
      }

      try {
        const newFav: FavoriteItem = {
          id: bubbleMapId,
          type: "bubblemap",
          name: bubbleMapName,
          starredAt: new Date().toISOString(),
          bubbleMapData,
        };

        const updated = [...favorites, newFav];
        saveFavorites(updated);
        return true;
      } catch (err) {
        console.error("Failed to add bubble map:", err);
        return false;
      }
    },
    [favorites, isLoggedIn, saveFavorites]
  );

  // Remove favorite by ID
  const removeFavorite = useCallback(
    (id: string) => {
      if (!isLoggedIn) {
        setError("Please log in to manage favorites");
        return false;
      }

      try {
        const updated = favorites.filter((fav) => fav.id !== id);
        saveFavorites(updated);
        return true;
      } catch (err) {
        console.error("Failed to remove favorite:", err);
        return false;
      }
    },
    [favorites, isLoggedIn, saveFavorites]
  );

  // Check if item is favorited
  const isFavorite = useCallback(
    (id: string) => {
      return favorites.some((fav) => fav.id === id);
    },
    [favorites]
  );

  // Get favorite topics only
  const getFavoriteTopics = useCallback(() => {
    return favorites.filter((fav) => fav.type === "topic");
  }, [favorites]);

  // Get favorite bubble maps only
  const getFavoriteBubbleMaps = useCallback(() => {
    return favorites.filter((fav) => fav.type === "bubblemap");
  }, [favorites]);

  // Clear all favorites
  const clearAllFavorites = useCallback(() => {
    if (!isLoggedIn) {
      setError("Please log in to manage favorites");
      return false;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      setFavorites([]);
      return true;
    } catch (err) {
      console.error("Failed to clear favorites:", err);
      return false;
    }
  }, [isLoggedIn]);

  // Initialize: Check auth and load favorites
  useEffect(() => {
    checkAuth();
    loadFavorites();
  }, [checkAuth, loadFavorites]);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    favorites, // All favorites
    isLoggedIn, // Is user logged in?
    loading,
    error,
    addFavoriteTopic, // Add topic to favorites
    addFavoriteBubbleMap, // Add bubble map to favorites
    removeFavorite, // Remove by ID
    isFavorite, // Check if favorited
    getFavoriteTopics, // Get topics only
    getFavoriteBubbleMaps, // Get bubble maps only
    clearAllFavorites, // Clear all
    refetch: loadFavorites, // Reload from localStorage
  };
}
