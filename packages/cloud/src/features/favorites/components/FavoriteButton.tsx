"use client";

import React from "react";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";

interface FavoriteButtonProps {
  id: string;
  name: string;
  type: "topic" | "bubblemap";
  category?: string;
  bubbleMapData?: any;
  className?: string;
}

/**
 * FavoriteButton Component
 *
 * Shows heart icon to save topics/bubble maps to favorites.
 * Requires login to save (shows login prompt if not logged in).
 */

export default function FavoriteButton({
  id,
  name,
  type,
  category,
  bubbleMapData,
  className = "",
}: FavoriteButtonProps) {
  const {
    isLoggedIn,
    isFavorite,
    addFavoriteTopic,
    addFavoriteBubbleMap,
    removeFavorite,
    error,
  } = useFavorites();

  const isFaved = isFavorite(id);

  const handleClick = () => {
    if (!isLoggedIn) {
      alert("Please log in to save favorites!");
      // Redirect to login page or show login modal
      return;
    }

    if (isFaved) {
      removeFavorite(id);
    } else {
      if (type === "topic") {
        addFavoriteTopic(id, name, category);
      } else {
        addFavoriteBubbleMap(id, name, bubbleMapData);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        className={`
          p-2 rounded-full transition-all duration-200
          ${
            isFaved
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
          }
        `}
        title={isFaved ? "Remove from favorites" : "Add to favorites"}
      >
        <svg
          className="w-6 h-6"
          fill={isFaved ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Login Required Badge */}
      {!isLoggedIn && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-gray-900"
          title="Login required"
        />
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-red-500/90 text-white text-sm rounded shadow-lg whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
