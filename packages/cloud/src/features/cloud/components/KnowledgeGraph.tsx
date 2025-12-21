"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GraphNode, GraphEdge } from "@/app/api/knowledge-graph/route";

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string; // ID of the central node
}

export default function KnowledgeGraph({ nodes, edges, onNodeClick, selectedNodeId }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Simulation state
  const [positions, setPositions] = useState<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize node positions
  useEffect(() => {
    const newPositions = new Map();
    const centerX = 600;
    const centerY = 400;

    // If there's a selected node, place it in the center
    if (selectedNodeId) {
      // Place selected node in center
      newPositions.set(selectedNodeId, {
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
      });

      // Place other nodes in a circle around it
      const otherNodes = nodes.filter(n => n.id !== selectedNodeId);
      const radius = 250;
      
      otherNodes.forEach((node, i) => {
        const angle = (i / otherNodes.length) * 2 * Math.PI;
        newPositions.set(node.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      });
    } else {
      // Default: arrange all nodes in a circle
      const radius = 300;
      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        newPositions.set(node.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      });
    }

    setPositions(newPositions);
  }, [nodes, selectedNodeId]);

  // Physics simulation
  useEffect(() => {
    if (positions.size === 0) return;

    const interval = setInterval(() => {
      const newPositions = new Map(positions);
      const alpha = 0.3; // Simulation intensity

      // Force-directed layout
      nodes.forEach(node => {
        const pos = newPositions.get(node.id);
        if (!pos) return;

        // Skip physics for the selected central node
        if (selectedNodeId && node.id === selectedNodeId) {
          // Keep it centered
          pos.x = 600;
          pos.y = 400;
          pos.vx = 0;
          pos.vy = 0;
          newPositions.set(node.id, pos);
          return;
        }

        let fx = 0;
        let fy = 0;

        // Repulsion between nodes
        nodes.forEach(otherNode => {
          if (node.id === otherNode.id) return;
          const otherPos = newPositions.get(otherNode.id);
          if (!otherPos) return;

          const dx = pos.x - otherPos.x;
          const dy = pos.y - otherPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (distance < 200) {
            const force = (200 - distance) / distance;
            fx += dx * force * 0.1;
            fy += dy * force * 0.1;
          }
        });

        // Attraction along edges
        edges.forEach(edge => {
          if (edge.source === node.id) {
            const targetPos = newPositions.get(edge.target);
            if (!targetPos) return;

            const dx = targetPos.x - pos.x;
            const dy = targetPos.y - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const force = Math.log(distance) * edge.strength * 0.05;
            fx += dx / distance * force;
            fy += dy / distance * force;
          }
        });

        // Center gravity
        const centerX = 600;
        const centerY = 400;
        fx += (centerX - pos.x) * 0.01;
        fy += (centerY - pos.y) * 0.01;

        // Update velocity and position
        pos.vx = (pos.vx + fx) * 0.85; // Damping
        pos.vy = (pos.vy + fy) * 0.85;
        pos.x += pos.vx * alpha;
        pos.y += pos.vy * alpha;

        newPositions.set(node.id, pos);
      });

      setPositions(newPositions);
    }, 50);

    return () => clearInterval(interval);
  }, [positions, nodes, edges]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.size === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply transformations
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    edges.forEach(edge => {
      const sourcePos = positions.get(edge.source);
      const targetPos = positions.get(edge.target);
      if (!sourcePos || !targetPos) return;

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.strokeStyle = `rgba(100, 150, 255, ${edge.strength * 0.5})`;
      ctx.lineWidth = edge.strength * 2;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const isCentralNode = selectedNodeId === node.id;
      const isSubTopic = node.id.includes('-sub-');
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      
      // Central node is larger, sub-topics are smaller
      const baseRadius = Math.sqrt(node.weight) * 0.5 + 5;
      const radius = isCentralNode ? baseRadius * 1.5 : (isSubTopic ? baseRadius * 0.7 : baseRadius);

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isCentralNode
        ? "rgba(139, 92, 246, 0.95)" // Purple for central topic
        : isSubTopic
        ? "rgba(59, 130, 246, 0.8)" // Blue for sub-topics
        : isSelected 
        ? "rgba(255, 100, 100, 0.9)"
        : isHovered 
        ? "rgba(100, 200, 255, 0.9)"
        : "rgba(100, 150, 255, 0.7)";
      ctx.fill();
      ctx.strokeStyle = isCentralNode ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = isCentralNode ? 4 : (isHovered || isSelected ? 3 : 1);
      ctx.stroke();

      // Node label - always show labels
      ctx.fillStyle = "white";
      ctx.font = `${isCentralNode ? 'bold 16px' : (isSubTopic ? '11px' : '14px')} sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.name, pos.x, pos.y - radius - 10);
    });

    ctx.restore();
  }, [positions, edges, nodes, zoom, pan, hoveredNode, selectedNode]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      // Check hover
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      let found = null;
      for (const node of nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;

        const radius = Math.sqrt(node.weight) * 0.5 + 5;
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        
        if (distance < radius) {
          found = node;
          break;
        }
      }

      setHoveredNode(found);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      if (onNodeClick) {
        onNodeClick(hoveredNode);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(3, Math.max(0.3, prev * delta)));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-950">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Info overlay */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-xs">
          <h3 className="text-white font-bold text-lg">{hoveredNode.name}</h3>
          <p className="text-gray-400 text-sm">{hoveredNode.category}</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>Weight: {hoveredNode.weight}</p>
            <p>Sub-topics: {hoveredNode.subTopics.length}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(0.3, prev * 0.8))}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm text-xs"
          title="Reset View"
        >
          ⟲
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm text-center">
        <p>Drag to move • Scroll to zoom • Click nodes for details</p>
      </div>
    </div>
  );
}
