"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import IslandIcon from "@/icons/IslandIcon";
import type { KnowledgeGraphData, GraphNode } from "@/app/api/knowledge-graph/route";

const KnowledgeGraph = dynamic(
  () => import("@/features/cloud/components/KnowledgeGraph"),
  { ssr: false }
);

export default function KnowledgeGraphPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  // Fetch graph data with optional topic filter
  useEffect(() => {
    const topicId = searchParams?.get('topic');
    const fromFavorites = searchParams?.get('from') === 'favorites';
    
    // If loading from favorites, check sessionStorage first
    if (fromFavorites && topicId) {
      const cachedGraph = sessionStorage.getItem('favorite-graph');
      if (cachedGraph) {
        try {
          const graphData = JSON.parse(cachedGraph);
          setGraphData(graphData);
          setLoading(false);
          sessionStorage.removeItem('favorite-graph'); // Clean up
          return;
        } catch (e) {
          console.error('Failed to parse cached graph:', e);
        }
      }
    }

    if (topicId) {
      // Auto-process relationships for this topic first
      processTopicRelationships(topicId).then(() => {
        fetchGraphData(topicId);
      });
    } else {
      fetchGraphData();
    }
  }, [searchParams]);

  // Process relationships for a specific topic
  const processTopicRelationships = async (topicId: string) => {
    try {
      setIsProcessing(true);
      console.log(`🔗 Processing relationships for topic: ${topicId}`);

      const response = await fetch("/api/knowledge-graph/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });

      const result = await response.json();
      
      if (result.cached) {
        console.log('✅ Using cached relationships');
      } else if (response.ok) {
        console.log(`✅ Generated ${result.relationships} new relationships`);
      }
    } catch (err) {
      console.error('Failed to process relationships:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-select topic from URL parameter
  useEffect(() => {
    if (graphData && searchParams) {
      const topicId = searchParams.get('topic');
      if (topicId) {
        const node = graphData.nodes.find(n => n.id === topicId);
        if (node) {
          setSelectedNode(node);
        }
      }
    }
  }, [graphData, searchParams]);

  const fetchGraphData = async (topicId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = topicId 
        ? `/api/knowledge-graph?topic=${encodeURIComponent(topicId)}`
        : "/api/knowledge-graph";

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch knowledge graph");
      }

      const data: KnowledgeGraphData = await response.json();
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    // Don't navigate if clicking a sub-topic node
    if (node.id.includes('-sub-')) {
      setSelectedNode(node);
      return;
    }
    
    // Navigate to show this topic's network
    router.push(`/knowledge-graph?topic=${encodeURIComponent(node.id)}`);
  };

  // Save current graph to favorites
  const handleSaveFavorite = async () => {
    const topicId = searchParams?.get('topic');
    if (!topicId || !graphData) return;

    try {
      setSavingFavorite(true);
      const mainNode = graphData.nodes.find(n => n.id === topicId);
      
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          topicName: mainNode?.name || 'Unknown Topic',
          category: mainNode?.category || 'Other',
          graphData: {
            nodes: graphData.nodes,
            edges: graphData.edges,
            stats: graphData.stats
          }
        })
      });

      if (response.status === 401) {
        // Not authenticated - redirect to login
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save favorite');
      }

      setIsFavorited(true);
      alert('✅ Knowledge graph saved to favorites!');
    } catch (err) {
      console.error('Error saving favorite:', err);
      alert('❌ Failed to save favorite');
    } finally {
      setSavingFavorite(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 bg-gray-900/50 backdrop-blur-sm border-b border-white/10">
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
            <button
              onClick={() => router.push("/favorites")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ⭐ My Favorites
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isProcessing && (
            <div className="flex items-center gap-2 text-purple-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400" />
              <span className="text-sm">Analyzing connections...</span>
            </div>
          )}

          {searchParams?.get('topic') && graphData && (
            <button
              onClick={handleSaveFavorite}
              disabled={savingFavorite || isFavorited}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFavorited
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50'
              }`}
            >
              {savingFavorite ? 'Saving...' : isFavorited ? '✓ Favorited' : '⭐ Save to Favorites'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="absolute inset-0 pt-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4" />
            <p className="text-white text-lg">Loading knowledge graph...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-400 text-lg mb-4">❌ {error}</p>
            <button
              onClick={() => fetchGraphData()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : graphData && graphData.nodes.length > 0 ? (
          <>
            <KnowledgeGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeClick={handleNodeClick}
              selectedNodeId={searchParams?.get('topic') || undefined}
            />

            {/* Stats Panel */}
            <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-sm">
              <h3 className="text-white font-bold mb-2">Graph Statistics</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>📊 Topics: {graphData.stats.totalNodes}</p>
                <p>🔗 Connections: {graphData.stats.totalEdges}</p>
                <p>📈 Avg Connections: {graphData.stats.avgConnections}</p>
              </div>
              {graphData.stats.mostConnected.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Most Connected:</p>
                  {graphData.stats.mostConnected.slice(0, 3).map((item, idx) => (
                    <p key={idx} className="text-xs text-gray-300">
                      {idx + 1}. {item.name} ({item.connections})
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Node Details - Simplified */}
            {selectedNode && !selectedNode.id.includes('-sub-') && (
              <div className="absolute top-24 right-4 bg-gray-900/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-xs">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-bold text-lg">{selectedNode.name}</h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-400 text-sm mb-3">{selectedNode.category}</p>
                <p className="text-xs text-gray-500">Weight: {selectedNode.weight}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-white text-lg mb-4">No topics found</p>
            <p className="text-gray-400 text-sm">
              Go back to Cloud page and click a topic to explore its connections
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
