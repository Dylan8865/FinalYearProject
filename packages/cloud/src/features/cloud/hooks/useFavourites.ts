"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Favourite item stored in localStorage
 * Stores both main topics and bubble maps
 */
export interface FavouriteItem {
  id: string;           // Topic ID or bubble map ID
  type: "topic" | "bubblemap";
  name: string;         // Topic name
  category?: string;    // Topic category
  starredAt: string;    // ISO timestamp
  bubbleMapData?: any;  // Full bubble map data (if type is bubblemap)
}

const STORAGE_KEY = "cloud_favourites";

/**
 * useFavourites Hook
 * 
 * No login required to view cloud.
 * Login required ONLY to save favorites.
 * Favorites stored in localStorage (client-side).
 */
export function useFavourites() {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
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
  const loadFavourites = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: FavouriteItem[] = JSON.parse(stored);
        setFavourites(data);
      }
    } catch (err) {
      console.error("Failed to load favourites:", err);
      setError("Failed to load favourites");
    } finally {
      setLoading(false);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavourites = useCallback((items: FavouriteItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setFavourites(items);
    } catch (err) {
      console.error("Failed to save favourites:", err);
      throw new Error("Failed to save favourites");
    }
  }, []);

  // Add topic to favourites
  const addFavouriteTopic = useCallback(
    (topicId: string, topicName: string, category?: string) => {
      if (!isLoggedIn) {
        setError("Please log in to save favourites");
        return false;
      }

      try {
        const newFav: FavouriteItem = {
          id: topicId,
          type: "topic",
          name: topicName,
          category,
          starredAt: new Date().toISOString(),
        };

        const updated = [...favourites, newFav];
        saveFavourites(updated);
        return true;
      } catch (err) {
        console.error("Failed to add favourite:", err);
        return false;
      }
    },
    [favourites, isLoggedIn, saveFavourites]
  );

  // Add bubble map to favourites
  const addFavouriteBubbleMap = useCallback(
    (bubbleMapId: string, bubbleMapName: string, bubbleMapData: any) => {
      if (!isLoggedIn) {
        setError("Please log in to save favourites");
        return false;
      }

      try {
        const newFav: FavouriteItem = {
          id: bubbleMapId,
          type: "bubblemap",
          name: bubbleMapName,
          starredAt: new Date().toISOString(),
          bubbleMapData,
        };

        const updated = [...favourites, newFav];
        saveFavourites(updated);
        return true;
      } catch (err) {
        console.error("Failed to add bubble map:", err);
        return false;
      }
    },
    [favourites, isLoggedIn, saveFavourites]
  );

  // Remove favourite by ID
  const removeFavourite = useCallback(
    (id: string) => {
      if (!isLoggedIn) {
        setError("Please log in to manage favourites");
        return false;
      }

      try {
        const updated = favourites.filter((fav) => fav.id !== id);
        saveFavourites(updated);
        return true;
      } catch (err) {
        console.error("Failed to remove favourite:", err);
        return false;
      }
    },
    [favourites, isLoggedIn, saveFavourites]
  );

  // Check if item is favourited
  const isFavourite = useCallback(
    (id: string) => {
      return favourites.some((fav) => fav.id === id);
    },
    [favourites]
  );

  // Get favourite topics only
  const getFavouriteTopics = useCallback(() => {
    return favourites.filter((fav) => fav.type === "topic");
  }, [favourites]);

  // Get favourite bubble maps only
  const getFavouriteBubbleMaps = useCallback(() => {
    return favourites.filter((fav) => fav.type === "bubblemap");
  }, [favourites]);

  // Clear all favourites
  const clearAllFavourites = useCallback(() => {
    if (!isLoggedIn) {
      setError("Please log in to manage favourites");
      return false;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      setFavourites([]);
      return true;
    } catch (err) {
      console.error("Failed to clear favourites:", err);
      return false;
    }
  }, [isLoggedIn]);

  // Initialize: Check auth and load favourites
  useEffect(() => {
    checkAuth();
    loadFavourites();
  }, [checkAuth, loadFavourites]);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    favourites,                     // All favourites
    isLoggedIn,                     // Is user logged in?
    loading,
    error,
    addFavouriteTopic,              // Add topic to favourites
    addFavouriteBubbleMap,          // Add bubble map to favourites
    removeFavourite,                // Remove by ID
    isFavourite,                    // Check if favourited
    getFavouriteTopics,             // Get topics only
    getFavouriteBubbleMaps,         // Get bubble maps only
    clearAllFavourites,             // Clear all
    refetch: loadFavourites,        // Reload from localStorage
  };
}

