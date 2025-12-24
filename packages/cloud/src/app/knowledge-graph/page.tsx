"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import dynamic from "next/dynamic";
import IslandIcon from "@/icons/IslandIcon";
import Breadcrumb from "@/features/knowledge-graph/components/Breadcrumb";
import SearchBar from "@/features/home/components/SearchBar";
import type {
  KnowledgeGraphData,
  GraphNode,
} from "@/app/api/knowledge-graph/route";

const KnowledgeGraph = dynamic(
  () => import("@/features/knowledge-graph/components/KnowledgeGraph3D"),
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
  const [searchValue, setSearchValue] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const search = searchValue.trim().toLowerCase();
    if (!search || !graphData) return;

    const matches = graphData.nodes.filter((n) =>
      n.name.toLowerCase().includes(search)
    );
    if (matches.length > 0) {
      const nextIndex = (matchIndex + 1) % matches.length;
      setMatchIndex(nextIndex);
      setSelectedNode(matches[nextIndex]);
    }
  };

  const handleClear = () => {
    setSearchValue("");
    setMatchIndex(0);
  };

  // Reset match index only when the trimmed search value changes
  useEffect(() => {
    setMatchIndex(0);
  }, [searchValue.trim()]);

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

          // Auto-select first node if none selected
          if (!selectedNode && graphData.nodes.length > 0) {
            setSelectedNode(graphData.nodes[0]);
          }

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

      console.log("Processing response:", response);

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

      // Auto-select the first level node on initial load or when navigating to a specific topic
      if (data.nodes.length > 0) {
        let nodeToSelect = null;
        if (topicId) {
          nodeToSelect = data.nodes.find((n) => n.id === topicId);
        }

        if (!nodeToSelect) {
          // If no specific topic or topic not found, sort and pick the top node
          const sorted = [...data.nodes].sort((a, b) => b.weight - a.weight);
          nodeToSelect = sorted[0];
        }

        if (nodeToSelect) {
          setSelectedNode(nodeToSelect);
          console.log(`🎯 Auto-selected node: ${nodeToSelect.name}`);
        }
      }

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
    <div className="relative w-screen h-screen bg-[#030712] overflow-hidden font-sans">
      {/* Immersive Background Canvas */}
      <div className="absolute inset-0 z-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-purple-500/20 animate-pulse rounded-full" />
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 relative z-10" />
            </div>
            <p className="text-purple-300 mt-6 font-medium tracking-widest animate-pulse">
              SYNTHESIZING KNOWLEDGE...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">🛸</div>
            <p className="text-red-400 text-lg mb-6 font-medium">
              Lost in Space: {error}
            </p>
            <button
              onClick={() => fetchGraphData()}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
            >
              Recalibrate
            </button>
          </div>
        ) : graphData && graphData.nodes.length > 0 ? (
          <KnowledgeGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeClick={handleNodeClick}
            selectedNodeId={
              selectedNode?.id || searchParams?.get("topic") || undefined
            }
            activeSearch={searchValue}
            searchMatchIndex={matchIndex}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">🌑</div>
            <p className="text-gray-400 text-lg">
              Void detected. No wisdom found here.
            </p>
          </div>
        )}
      </div>

      {/* Modern Glassmorphic Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 pointer-events-none">
        <div className="flex">
          <div className="flex items-center gap-6 pointer-events-auto">
            <button
              onClick={() => router.push("/")}
              className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white transition-all group"
              title="Return to Cloud"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex flex-col">
              <h1 className="text-white font-bold text-xl tracking-tight">
                Wisdom Island
              </h1>
              <p className="text-purple-400/80 text-[10px] uppercase tracking-[0.2em] font-medium">
                Neural Knowledge Graph
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pointer-events-auto">
            {/* Search Overlay */}
            <div className="w-64">
              <SearchBar
                value={searchValue}
                onChange={setSearchValue}
                onSubmit={handleSearchSubmit}
                onClear={handleClear}
                placeholder="Search graph..."
                className="scale-75 origin-right"
              />
            </div>

            {isProcessing && (
              <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/10 backdrop-blur-md rounded-full border border-purple-500/20">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400" />
                <span className="text-[10px] text-purple-300 font-medium uppercase tracking-widest">
                  Analyzing...
                </span>
              </div>
            )}

            {isFavorited && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 backdrop-blur-md rounded-full border border-green-500/20">
                <span className="text-green-400 text-xs">✓ Saved</span>
              </div>
            )}

            {!isFavorited && user && !loading && graphData && (
              <button
                onClick={handleSaveFavorite}
                disabled={savingFavorite}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-full transition-all hover:scale-105 disabled:opacity-50 shadow-lg shadow-purple-500/20"
              >
                {savingFavorite ? "Saving..." : "Save to Favorites"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Breadcrumb */}
      {breadcrumbPath.length > 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <div className="bg-black/20 backdrop-blur-xl px-6 py-3 border border-white/10 rounded-full shadow-2xl">
            <Breadcrumb
              path={breadcrumbPath}
              onNavigate={handleBreadcrumbNavigate}
            />
          </div>
        </div>
      )}

      {/* Stats Panel - Floating Minimal Design */}
      {graphData && !loading && (
        <div className="absolute bottom-8 left-8 z-10 w-64 pointer-events-auto">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-sm">
                Ecosystem Stats
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                  Nodes
                </span>
                <span className="text-white text-lg font-mono">
                  {graphData.stats.totalNodes}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                  Links
                </span>
                <span className="text-white text-lg font-mono">
                  {graphData.stats.totalEdges}
                </span>
              </div>
            </div>

            {graphData.stats.mostConnected.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-4">
                  Dominant Topics
                </p>
                <div className="space-y-3">
                  {graphData.stats.mostConnected
                    .slice(0, 3)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-gray-300 text-xs truncate max-w-[120px] group-hover:text-purple-400 transition-colors">
                          {item.name}
                        </span>
                        <span className="text-purple-500/60 text-[10px] font-mono">
                          {item.connections} 🔗
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back Button - Floating Round Design */}
      {navigationHistory.length > 0 && (
        <button
          onClick={() => {
            const lastHistory = navigationHistory[navigationHistory.length - 1];
            setGraphData(lastHistory.graph);
            setBreadcrumbPath(lastHistory.breadcrumb);
            setSelectedNode(lastHistory.node);
            setNavigationHistory((prev) => prev.slice(0, -1));
          }}
          className="absolute bottom-8 left-80 z-10 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all hover:scale-110 active:scale-95 shadow-xl shadow-blue-600/20 border border-blue-400/30"
          title="Go back one level"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Selected Node Details - Floating Glass Sidebar */}
      {selectedNode && (
        <div className="absolute inset-y-0 right-0 z-20 w-80 p-8 pointer-events-none">
          <div className="h-full bg-white/[0.03] backdrop-blur-2xl border-l border-white/10 rounded-l-[40px] p-8 shadow-2xl pointer-events-auto flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-purple-500/20 rounded-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <h3 className="text-white font-bold text-2xl mb-2">
              {selectedNode.name}
            </h3>
            <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-6">
              {selectedNode.category || "General"}
            </span>

            <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-gray-400 text-xs leading-relaxed">
                  Discover deep connections and explore the orbital topics
                  around{" "}
                  <span className="text-white font-medium">
                    {selectedNode.name}
                  </span>
                  . Click on surrounding nodes to specialize further.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                  Knowledge Weight
                </span>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-1000"
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedNode.weight / 100) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => handleNodeClick(selectedNode)}
              className="mt-8 w-full py-4 bg-white text-black font-bold rounded-2xl transition-all hover:bg-purple-100 hover:scale-[1.02] active:scale-[0.98] shadow-xl"
            >
              Drill Deeper
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
