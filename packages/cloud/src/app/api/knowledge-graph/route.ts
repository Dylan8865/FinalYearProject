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
 * GET /api/knowledge-graph?topic=name_or_uuid
 * Fetch knowledge graph data for visualization
 * - If topic param provided: Returns only that topic and its directly connected neighbors
 * - Topic can be either UUID or topic name
 * - If no param: Returns all topics and relationships
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const topicParam = searchParams.get('topic');

    // Fetch all topics (nodes)
    const { data: topics, error: topicsError } = await supabase
      .from("cloud-topics-cache")
      .select("id, main_topic, category, weight, sub_topics, parent_topic_id, depth_level");

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
    let selectedTopic: any = null; // Declare outside for parent chain access
    
    if (topicParam) {
      // Find the selected topic by ID or name
      selectedTopic = topics.find(t => 
        t.id === topicParam || t.main_topic === topicParam
      );
      
      if (selectedTopic) {
        // Create nodes for main topic
        filteredNodes = [
          {
            id: selectedTopic.id,
            name: selectedTopic.main_topic,
            category: selectedTopic.category || "Other",
            weight: selectedTopic.weight || 50,
            subTopics: selectedTopic.sub_topics || [],
          }
        ];

        // Fetch actual child topics from database using parent_topic_id
        const { data: childTopics } = await supabase
          .from("cloud-topics-cache")
          .select("id, main_topic, category, weight")
          .eq("parent_topic_id", selectedTopic.id);

        let subTopicNodes: GraphNode[] = [];

        // If no child topics exist but sub_topics JSON array has data, migrate them to database
        if ((!childTopics || childTopics.length === 0) && selectedTopic.sub_topics && selectedTopic.sub_topics.length > 0) {
          console.log(`🔄 Migrating sub-topics for "${selectedTopic.main_topic}" to database...`);
          
          // Create database records for each sub-topic
          const subTopicsToInsert = selectedTopic.sub_topics.map((name: string) => ({
            main_topic: name,
            parent_topic_id: selectedTopic.id,
            depth_level: 1, // First level sub-topics
            category: selectedTopic.category || "Other",
            weight: 40,
            sub_topics: [],
            has_children: false
          }));

          const { data: insertedTopics, error: insertError } = await supabase
            .from("cloud-topics-cache")
            .insert(subTopicsToInsert)
            .select("id, main_topic, category, weight");

          if (!insertError && insertedTopics) {
            console.log(`✅ Migrated ${insertedTopics.length} sub-topics to database`);
            
            // Update parent to mark it has children
            await supabase
              .from("cloud-topics-cache")
              .update({ has_children: true })
              .eq("id", selectedTopic.id);

            subTopicNodes = insertedTopics.map((topic: any) => ({
              id: topic.id,
              name: topic.main_topic,
              category: topic.category || "Other",
              weight: topic.weight || 40,
              subTopics: [],
            }));
          } else {
            console.error("Failed to migrate sub-topics:", insertError);
          }
        } else if (childTopics && childTopics.length > 0) {
          // Child topics already exist in database
          subTopicNodes = childTopics.map((child: any) => ({
            id: child.id,
            name: child.main_topic,
            category: child.category || "Other",
            weight: child.weight || 40,
            subTopics: [],
          }));
        }

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
        // Original filtering logic if topic not found by name, try by ID
        const connectedEdges = edges.filter(
          edge => edge.source === topicParam || edge.target === topicParam
        );

        const connectedNodeIds = new Set<string>([topicParam]);
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

    // If this is a single topic, fetch its parent chain for breadcrumb
    let parentChain: Array<{ id: string; name: string }> = [];
    if (topicParam && selectedTopic) {
      let currentParentId = selectedTopic.parent_topic_id;
      
      // Traverse up the parent chain
      while (currentParentId) {
        const parent = topics.find(t => t.id === currentParentId);
        if (!parent) break;
        
        parentChain.unshift({ id: parent.id, name: parent.main_topic });
        currentParentId = parent.parent_topic_id;
      }
    }

    return NextResponse.json({ ...graphData, parentChain });

  } catch (error) {
    console.error("💥 Knowledge graph fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch graph" },
      { status: 500 }
    );
  }
}
