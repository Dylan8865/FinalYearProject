"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import IslandIcon from "@/icons/IslandIcon";

interface Favorite {
  id: string;
  topic_id: string;
  topic_name: string;
  category: string;
  graph_data: {
    nodes: any[];
    edges: any[];
    stats: any;
  };
  created_at: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (favoriteId: string) => {
    if (!confirm('Are you sure you want to remove this favorite?')) return;

    try {
      const response = await fetch(`/api/favorites?id=${favoriteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete favorite');
      }

      // Remove from local state
      setFavorites(favorites.filter(f => f.id !== favoriteId));
    } catch (err) {
      alert('Failed to delete favorite');
    }
  };

  const handleViewGraph = (favorite: Favorite) => {
    // Store graph data in sessionStorage for instant loading
    sessionStorage.setItem('favorite-graph', JSON.stringify(favorite.graph_data));
    router.push(`/knowledge-graph?topic=${favorite.topic_id}&from=favorites`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push("/mike/island")}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <IslandIcon />
            </button>

            <nav className="flex gap-6">
              <button
                onClick={() => router.push("/")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Cloud
              </button>
            </nav>
          </div>

          <h1 className="text-2xl font-bold text-white">⭐ My Favorites</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4" />
            <p className="text-white text-lg">Loading your favorites...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-400 text-lg mb-4">❌ {error}</p>
            <button
              onClick={fetchFavorites}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-white text-lg mb-4">No favorites yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Explore knowledge graphs and save your favorites!
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              Explore Topics
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:border-purple-500/50 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      {favorite.topic_name}
                    </h3>
                    <p className="text-gray-400 text-sm">{favorite.category}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(favorite.id);
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    🗑️
                  </button>
                </div>

                <div className="text-sm text-gray-400 space-y-1 mb-4">
                  <p>📊 Topics: {favorite.graph_data.nodes?.length || 0}</p>
                  <p>🔗 Connections: {favorite.graph_data.edges?.length || 0}</p>
                  <p className="text-xs text-gray-500">
                    Saved: {new Date(favorite.created_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleViewGraph(favorite)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Graph
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
