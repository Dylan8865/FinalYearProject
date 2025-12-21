import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface GraphNode {
  id: string;
  name: string;
  category: string;
  weight: number;
  subTopics: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: string;
  reasoning?: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgConnections: number;
    mostConnected: { name: string; connections: number }[];
  };
}

/**
 * GET /api/knowledge-graph?topic=uuid
 * Fetch knowledge graph data for visualization
 * - If topic param provided: Returns only that topic and its directly connected neighbors
 * - If no param: Returns all topics and relationships
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topic');

    // Fetch all topics (nodes)
    const { data: topics, error: topicsError } = await supabase
      .from("cloud-topics-cache")
      .select("id, main_topic, category, weight, sub_topics");

    if (topicsError || !topics) {
      throw new Error("Failed to fetch topics");
    }

    // Fetch all relationships (edges)
    const { data: relationships, error: relError } = await supabase
      .from("topic-relationships")
      .select("source_topic_id, target_topic_id, strength, relationship_type, reasoning")
      .gte("strength", 0.4); // Only include meaningful connections

    if (relError) {
      throw new Error("Failed to fetch relationships");
    }

    // Transform to graph format
    const nodes: GraphNode[] = topics.map(topic => ({
      id: topic.id,
      name: topic.main_topic,
      category: topic.category || "Other",
      weight: topic.weight || 50,
      subTopics: topic.sub_topics || [],
    }));

    let edges: GraphEdge[] = (relationships || []).map(rel => ({
      source: rel.source_topic_id,
      target: rel.target_topic_id,
      strength: rel.strength,
      type: rel.relationship_type,
      reasoning: rel.reasoning,
    }));

    // Filter by topic if specified
    let filteredNodes = nodes;
    if (topicId) {
      // Find the selected topic
      const selectedTopic = topics.find(t => t.id === topicId);
      
      if (selectedTopic) {
        // Create nodes for main topic + sub-topics
        filteredNodes = [
          {
            id: selectedTopic.id,
            name: selectedTopic.main_topic,
            category: selectedTopic.category || "Other",
            weight: selectedTopic.weight || 50,
            subTopics: selectedTopic.sub_topics || [],
          }
        ];

        // Add sub-topics as separate nodes
        const subTopicNodes: GraphNode[] = (selectedTopic.sub_topics || []).map((subTopic: string, idx: number) => ({
          id: `${selectedTopic.id}-sub-${idx}`,
          name: subTopic,
          category: selectedTopic.category || "Other",
          weight: 40, // Smaller weight for sub-topics
          subTopics: [],
        }));

        filteredNodes = [...filteredNodes, ...subTopicNodes];

        // Create edges from main topic to all sub-topics
        edges = subTopicNodes.map(subNode => ({
          source: selectedTopic.id,
          target: subNode.id,
          strength: 0.8,
          type: "related",
          reasoning: "Sub-topic"
        }));
      } else {
        // Original filtering logic if topic not found
        const connectedEdges = edges.filter(
          edge => edge.source === topicId || edge.target === topicId
        );

        const connectedNodeIds = new Set<string>([topicId]);
        connectedEdges.forEach(edge => {
          connectedNodeIds.add(edge.source);
          connectedNodeIds.add(edge.target);
        });

        filteredNodes = nodes.filter(node => connectedNodeIds.has(node.id));
        edges = connectedEdges;
      }
    }

    // Calculate statistics
    const connectionCounts = new Map<string, number>();
    edges.forEach(edge => {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    });

    const mostConnected = Array.from(connectionCounts.entries())
      .map(([id, count]) => {
        const node = filteredNodes.find(n => n.id === id);
        return { name: node?.name || "Unknown", connections: count };
      })
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    const avgConnections = filteredNodes.length > 0 
      ? edges.length / filteredNodes.length 
      : 0;

    const graphData: KnowledgeGraphData = {
      nodes: filteredNodes,
      edges,
      stats: {
        totalNodes: filteredNodes.length,
        totalEdges: edges.length,
        avgConnections: Math.round(avgConnections * 10) / 10,
        mostConnected,
      },
    };

    return NextResponse.json(graphData);

  } catch (error) {
    console.error("💥 Knowledge graph fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch graph" },
      { status: 500 }
    );
  }
}
