"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

export interface BubbleNode {
  id: string;
  name: string;
  type: "main" | "sub";
  size: number;
  x: number;
  y: number;
  relevance?: number;
}

export interface BubbleLink {
  source: string;
  target: string;
  strength: number;
}

export interface BubbleMapProps {
  mainTopic: string;
  category: string;
  nodes: BubbleNode[];
  links: BubbleLink[];
  onNodeClick?: (node: BubbleNode) => void;
  onBack?: () => void;
}

/**
 * Interactive Bubble Map Component
 *
 * Features:
 * - 360° draggable movement
 * - Zoom in/out with mouse wheel
 * - Touch support for mobile
 * - Animated connections between bubbles
 * - Click interaction on nodes
 */
export default function BubbleMap({
  mainTopic,
  category,
  nodes,
  links,
  onNodeClick,
  onBack,
}: BubbleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Transform state (pan and zoom)
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Node positions (for animation)
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  // Hovered node
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Initialize node positions
  useEffect(() => {
    const positions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => {
      positions.set(node.id, { x: node.x, y: node.y });
    });
    setNodePositions(positions);
  }, [nodes]);

  // Get canvas center
  const getCenter = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  }, []);

  // Draw the bubble map on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    const center = getCenter();
    const { x: panX, y: panY, scale } = transform;

    // Helper to transform coordinates
    const transformPoint = (x: number, y: number) => ({
      x: center.x + (x + panX) * scale,
      y: center.y + (y + panY) * scale,
    });

    // Draw links (connections)
    ctx.strokeStyle = "rgba(100, 200, 255, 0.4)";
    ctx.lineWidth = 2 * scale;

    links.forEach((link) => {
      const sourcePos = nodePositions.get(link.source);
      const targetPos = nodePositions.get(link.target);

      if (sourcePos && targetPos) {
        const from = transformPoint(sourcePos.x, sourcePos.y);
        const to = transformPoint(targetPos.x, targetPos.y);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);

        // Gradient based on strength
        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, `rgba(100, 200, 255, ${link.strength * 0.8})`);
        gradient.addColorStop(1, `rgba(50, 150, 200, ${link.strength * 0.6})`);
        ctx.strokeStyle = gradient;

        ctx.stroke();
      }
    });

    // Draw nodes (bubbles)
    nodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const { x, y } = transformPoint(pos.x, pos.y);
      const radius = node.size * scale * 0.5;

      // Check if hovered
      const isHovered = hoveredNode === node.id;
      const isMain = node.type === "main";

      // Draw shadow
      ctx.shadowColor = isMain ? "rgba(0, 100, 200, 0.5)" : "rgba(0, 150, 200, 0.3)";
      ctx.shadowBlur = isHovered ? 20 : 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw bubble
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      // Gradient fill
      const gradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        0,
        x,
        y,
        radius
      );

      if (isMain) {
        gradient.addColorStop(0, "#4facfe");
        gradient.addColorStop(1, "#00f2fe");
      } else {
        const alpha = node.relevance || 0.7;
        gradient.addColorStop(0, `rgba(100, 200, 255, ${alpha})`);
        gradient.addColorStop(1, `rgba(50, 150, 200, ${alpha})`);
      }

      ctx.fillStyle = gradient;
      ctx.fill();

      // Border
      ctx.strokeStyle = isHovered ? "#fff" : "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Draw text
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const fontSize = Math.max(10, Math.min(16, radius * 0.35));
      ctx.font = `${isMain ? "bold " : ""}${fontSize}px Inter, sans-serif`;

      // Word wrap for long text
      const words = node.name.split(" ");
      const lineHeight = fontSize * 1.2;
      let line = "";
      let lines: string[] = [];

      words.forEach((word) => {
        const testLine = line + (line ? " " : "") + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > radius * 1.5 && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });
      lines.push(line);

      const startY = y - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((l, i) => {
        ctx.fillText(l, x, startY + i * lineHeight);
      });
    });
  }, [nodes, links, nodePositions, transform, hoveredNode, getCenter]);

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [draw]);

  // Mouse/Touch event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check for hover
    const center = getCenter();
    const { x: panX, y: panY, scale } = transform;

    let found = false;
    for (const node of nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const nodeX = center.x + (pos.x + panX) * scale;
      const nodeY = center.y + (pos.y + panY) * scale;
      const radius = node.size * scale * 0.5;

      const dx = mouseX - nodeX;
      const dy = mouseY - nodeY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        setHoveredNode(node.id);
        canvas.style.cursor = "pointer";
        found = true;
        break;
      }
    }

    if (!found) {
      setHoveredNode(null);
      canvas.style.cursor = isDragging ? "grabbing" : "grab";
    }

    // Handle dragging
    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hoveredNode && onNodeClick) {
      const node = nodes.find((n) => n.id === hoveredNode);
      if (node) {
        onNodeClick(node);
      }
    }
  };

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, transform.scale * delta));

    setTransform((prev) => ({
      ...prev,
      scale: newScale,
    }));
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - transform.x, y: touch.clientY - transform.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setTransform((prev) => ({
        ...prev,
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Reset view
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm transition-colors"
          >
            ← Back
          </button>
        )}
        <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white">{mainTopic}</h2>
          <p className="text-sm text-white/70">{category}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: prev.scale * 1.2 }))}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xl backdrop-blur-sm transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: prev.scale * 0.8 }))}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xl backdrop-blur-sm transition-colors"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm backdrop-blur-sm transition-colors"
          title="Reset View"
        >
          ⟲
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 text-white/50 text-sm">
        Drag to move • Scroll to zoom • Click bubbles for details
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
