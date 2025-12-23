"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import IslandIcon from "@/icons/IslandIcon";
import Breadcrumb from "@/features/cloud/components/Breadcrumb";
import type {
  KnowledgeGraphData,
  GraphNode,
} from "@/app/api/knowledge-graph/route";

const KnowledgeGraph = dynamic(
  () => import("@/features/cloud/components/KnowledgeGraph3D"),
  { ssr: false }
);

interface BreadcrumbItem {
  id: string;
  name: string;
  level: number;
}

export default function KnowledgeGraphPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItem[]>([]);
  const [isDrillingDown, setIsDrillingDown] = useState(false);

  // Navigation history stack for instant back navigation (Option 2)
  const [navigationHistory, setNavigationHistory] = useState<
    Array<{
      graph: KnowledgeGraphData;
      breadcrumb: BreadcrumbItem[];
      node: GraphNode;
    }>
  >([]);

  // Check if current topic is favorited when page loads
  useEffect(() => {
    const checkIfFavorited = async () => {
      if (!user || authLoading) return;

      const topicId = searchParams?.get("topic");
      if (!topicId) return;

      try {
        const response = await fetch("/api/favorites");
        if (response.ok) {
          const favorites = await response.json();
          const isAlreadyFavorited = favorites.some(
            (fav: any) => fav.topic_id === topicId
          );
          setIsFavorited(isAlreadyFavorited);
        }
      } catch (error) {
        console.error("Failed to check favorite status:", error);
      }
    };

    checkIfFavorited();
  }, [user, authLoading, searchParams]);

  // Fetch graph data with optional topic filter
  useEffect(() => {
    const topicId = searchParams?.get("topic");
    const fromFavorites = searchParams?.get("from") === "favorites";

    // If loading from favorites, check sessionStorage first
    if (fromFavorites && topicId) {
      const cachedGraph = sessionStorage.getItem("favorite-graph");
      if (cachedGraph) {
        try {
          const graphData = JSON.parse(cachedGraph);
          setGraphData(graphData);
          setLoading(false);
          sessionStorage.removeItem("favorite-graph"); // Clean up
          return;
        } catch (e) {
          console.error("Failed to parse cached graph:", e);
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

      console.log('Processing response:', response);

      const result = await response.json();

      if (result.cached) {
        console.log("✅ Using cached relationships");
      } else if (response.ok) {
        console.log(`✅ Generated ${result.relationships} new relationships`);
      }
    } catch (err) {
      console.error("Failed to process relationships:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-select topic from URL parameter
  useEffect(() => {
    if (graphData && searchParams) {
      const topicId = searchParams.get("topic");
      if (topicId) {
        const node = graphData.nodes.find((n) => n.id === topicId);
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

      const responseData = await response.json();
      const data: KnowledgeGraphData = responseData;
      setGraphData(data);

      // Build initial breadcrumb ONLY if we don't have one yet
      // (Don't overwrite breadcrumb from drill-down navigation)
      if (topicId && breadcrumbPath.length === 0) {
        const currentNode = data.nodes.find((n) => n.id === topicId);
        if (currentNode) {
          const breadcrumb: BreadcrumbItem[] = [
            {
              id: currentNode.id,
              name: currentNode.name,
              level: 1,
            },
          ];
          setBreadcrumbPath(breadcrumb);
          console.log(
            `🎉 Initial breadcrumb created for "${currentNode.name}"`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = async (node: GraphNode) => {
    console.log("🖱️ Node clicked:", node);

    // Set selected node for UI feedback
    setSelectedNode(node);

    // Matryoshka drilling: Generate sub-topics for clicked node
    await drillDownToTopic(node);
  };

  const drillDownToTopic = async (node: GraphNode) => {
    try {
      setIsDrillingDown(true);
      setError(null);

      // Check if this node is already in the breadcrumb path (prevent duplicates)
      const isAlreadyInPath = breadcrumbPath.some(
        (item) => item.id === node.id
      );
      if (isAlreadyInPath) {
        console.warn("Node already in breadcrumb path, skipping drill down");
        setIsDrillingDown(false);
        return;
      }

      // Save current state to navigation history BEFORE drilling down
      if (graphData) {
        console.log(`💾 Saving current state to history stack`);
        setNavigationHistory((prev) => [
          ...prev,
          {
            graph: graphData,
            breadcrumb: breadcrumbPath,
            node: selectedNode || graphData.nodes[0],
          },
        ]);
      }

      // Add the clicked node to breadcrumb path
      const currentDepth = breadcrumbPath.length + 1;
      const newBreadcrumb: BreadcrumbItem = {
        id: node.id,
        name: node.name,
        level: currentDepth,
      };
      const newPath = [...breadcrumbPath, newBreadcrumb];
      setBreadcrumbPath(newPath);

      // Generate sub-topics for this node
      const response = await fetch("/api/knowledge-graph/generate-subtopics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentTopicId: node.id,
          parentTopicName: node.name,
          currentDepth: currentDepth + 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to generate sub-topics");
      }

      const data = await response.json();

      if (data.reachedLimit) {
        alert(data.message);
        // Don't add to history if we hit the limit
        setNavigationHistory((prev) => prev.slice(0, -1));
        setBreadcrumbPath(breadcrumbPath); // Restore original breadcrumb
        return;
      }

      // Create graph with parent as center and sub-topics around it
      const centerNode: GraphNode = {
        id: node.id,
        name: node.name,
        category: node.category,
        weight: 80,
        subTopics: [],
      };

      const subTopicNodes: GraphNode[] = (data.subTopics || []).map(
        (topic: any) => ({
          id: topic.id,
          name: topic.main_topic,
          category: topic.category || node.category,
          weight: 50,
          subTopics: [],
        })
      );

      const edges = subTopicNodes.map((subNode) => ({
        source: node.id,
        target: subNode.id,
        strength: 0.8,
        type: "parent-child",
        reasoning: "Sub-topic",
      }));

      const newGraphData = {
        nodes: [centerNode, ...subTopicNodes],
        edges: edges,
        stats: {
          totalNodes: subTopicNodes.length + 1,
          totalEdges: edges.length,
          avgConnections: edges.length / (subTopicNodes.length + 1),
          mostConnected: [{ name: node.name, connections: edges.length }],
        },
      };

      setGraphData(newGraphData);
      setSelectedNode(node); // Update selected node to the drilled-down topic
    } catch (err) {
      console.error("Drill-down error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to drill down into topic"
      );

      // Restore state - remove the failed breadcrumb addition and pop from history
      setBreadcrumbPath(breadcrumbPath);
      if (navigationHistory.length > 0) {
        setNavigationHistory((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsDrillingDown(false);
    }
  };

  const handleBreadcrumbNavigate = (topicId: string) => {
    if (topicId === "root") {
      // Go back to cloud page
      router.push("/");
      return;
    }

    // Find the target position in breadcrumb
    const targetIndex = breadcrumbPath.findIndex((item) => item.id === topicId);
    if (targetIndex === -1) return;

    // Calculate how many steps to go back
    const stepsBack = breadcrumbPath.length - targetIndex - 1;

    if (stepsBack > 0 && stepsBack <= navigationHistory.length) {
      // Go back in history stack
      const targetHistory =
        navigationHistory[navigationHistory.length - stepsBack];

      console.log(`⚡ Restoring from history stack (${stepsBack} steps back)`);
      setGraphData(targetHistory.graph);
      setBreadcrumbPath(targetHistory.breadcrumb);
      setSelectedNode(targetHistory.node);

      // Trim history stack
      setNavigationHistory((prev) => prev.slice(0, -stepsBack));
    }
  };

  // Save current graph to favorites
  const handleSaveFavorite = async () => {
    // Check if user is logged in
    if (!user) {
      router.push("/login");
      return;
    }

    const topicParam = searchParams?.get("topic");
    if (!topicParam || !graphData) return;

    try {
      setSavingFavorite(true);
      // Find node by ID or name (since URL can have either)
      const mainNode = graphData.nodes.find(
        (n) => n.id === topicParam || n.name === topicParam
      );

      if (!mainNode) {
        throw new Error("Topic not found in graph data");
      }

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: mainNode.id, // Use the actual UUID
          topicName: mainNode.name,
          category: mainNode.category || "Other",
          graphData: {
            nodes: graphData.nodes,
            edges: graphData.edges,
            stats: graphData.stats,
          },
        }),
      });

      if (response.status === 401) {
        // Not authenticated - redirect to login
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to save favorite");
      }

      setIsFavorited(true);
      alert("✅ Knowledge graph saved to favorites!");
    } catch (err) {
      console.error("Error saving favorite:", err);
      alert("❌ Failed to save favorite");
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

          {searchParams?.get("topic") &&
            graphData &&
            // Option 2: Only show save button at initial page (no breadcrumb), show green indicator after drilling down
            (breadcrumbPath.length === 0 ? (
              // Initial page (no breadcrumb yet): Show full save functionality
              user ? (
                <button
                  onClick={handleSaveFavorite}
                  disabled={savingFavorite || isFavorited}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isFavorited
                      ? "bg-green-600 text-white cursor-default"
                      : "bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                  }`}
                >
                  {savingFavorite
                    ? "Saving..."
                    : isFavorited
                    ? "✓ Favorited"
                    : "⭐ Save to Favorites"}
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                >
                  🔒 Sign in to Save
                </button>
              )
            ) : (
              // After drilling down (Level 1, 2, 3...): Only show green indicator if main topic is favorited
              isFavorited &&
              user && (
                <div className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white cursor-default">
                  ✓ Favorited
                </div>
              )
            ))}

          {/* Quick back to main topic button - shows when at Level 1+ */}
          {breadcrumbPath.length > 1 && (
            <button
              onClick={() => handleBreadcrumbNavigate(breadcrumbPath[0].id)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
              title={`Back to ${breadcrumbPath[0].name}`}
            >
              ← {breadcrumbPath[0].name}
            </button>
          )}
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      {breadcrumbPath.length > 0 && (
        <div className="absolute top-20 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm px-6 py-3 border-b border-white/10">
          <Breadcrumb
            path={breadcrumbPath}
            onNavigate={handleBreadcrumbNavigate}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={`absolute inset-0 ${
          breadcrumbPath.length > 0 ? "pt-32" : "pt-20"
        }`}
      >
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
              selectedNodeId={searchParams?.get("topic") || undefined}
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
                  {graphData.stats.mostConnected
                    .slice(0, 3)
                    .map((item, idx) => (
                      <p key={idx} className="text-xs text-gray-300">
                        {idx + 1}. {item.name} ({item.connections})
                      </p>
                    ))}
                </div>
              )}
            </div>

            {/* Back Button - Shows when we have navigation history */}
            {navigationHistory.length > 0 && (
              <button
                onClick={() => {
                  // Pop the last item from history and restore it
                  const lastHistory =
                    navigationHistory[navigationHistory.length - 1];
                  console.log(`⬅️ Going back one step in history`);

                  setGraphData(lastHistory.graph);
                  setBreadcrumbPath(lastHistory.breadcrumb);
                  setSelectedNode(lastHistory.node);

                  // Remove the last item from history
                  setNavigationHistory((prev) => prev.slice(0, -1));
                }}
                className="absolute bottom-4 left-96 px-6 py-3 rounded-lg text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 shadow-lg border-2 border-blue-400"
                title="Go back one level"
              >
                ← Back
              </button>
            )}

            {/* Selected Node Details */}
            {selectedNode && (
              <div className="absolute top-32 right-4 bg-gray-900/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-xs">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-bold text-lg">
                    {selectedNode.name}
                  </h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  {selectedNode.category}
                </p>
                <p className="text-xs text-gray-500">
                  Weight: {selectedNode.weight}
                </p>
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
