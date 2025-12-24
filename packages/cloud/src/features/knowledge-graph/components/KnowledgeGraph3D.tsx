"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Line, Float, Html } from "@react-three/drei";
import * as THREE from "three";
import type { GraphNode, GraphEdge } from "@/app/api/knowledge-graph/route";
import {
  SpaceBackground,
  FloatingParticles,
  FloatingClouds,
} from "@/components/three/Environment3D";

interface KnowledgeGraph3DProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string;
  activeSearch?: string;
  searchMatchIndex?: number;
}

// Individual node component with interactive text
function Node({
  node,
  position,
  isSelected,
  isHighlighted,
  isCurrentMatch,
  isSearching,
  onClick,
}: {
  node: GraphNode;
  position: [number, number, number];
  isSelected: boolean;
  isHighlighted: boolean;
  isCurrentMatch: boolean;
  isSearching: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const [justClicked, setJustClicked] = React.useState(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    setJustClicked(true);
    onClick();
    setTimeout(() => setJustClicked(false), 200);
  };

  const isVisualFocus = hovered || isCurrentMatch || isSelected;
  const isAltFocus = hovered || isHighlighted;
  const color = isCurrentMatch
    ? "#c084fc"
    : isHighlighted || isSelected
    ? "#a855f7"
    : "white";

  return (
    <Float
      speed={isVisualFocus ? 4 : 1.5}
      rotationIntensity={0.2}
      floatIntensity={0.5}
    >
      <group position={position}>
        <Html
          center
          distanceFactor={10}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "auto" }}
        >
          <div
            onClick={handleClick}
            onMouseEnter={() => {
              setHovered(true);
              document.body.style.cursor = "pointer";
            }}
            onMouseLeave={() => {
              setHovered(false);
              document.body.style.cursor = "auto";
            }}
            style={{
              color: color,
              fontSize: isSelected || isCurrentMatch ? "20px" : "14px",
              fontWeight: isVisualFocus ? "bold" : "500",
              whiteSpace: "nowrap",
              userSelect: "none",
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: isVisualFocus
                ? "scale(1.3)"
                : isAltFocus
                ? "scale(1.1)"
                : "scale(1)",
              opacity:
                isCurrentMatch || isSelected
                  ? 1
                  : isHighlighted
                  ? 0.7
                  : isSearching
                  ? 0.1
                  : 0.8,
              padding: "6px 12px",
              background: isCurrentMatch
                ? "rgba(192, 132, 252, 0.4)" // Brighter purple for current focus
                : isHighlighted
                ? "rgba(168, 85, 247, 0.15)"
                : isSelected
                ? "rgba(168, 85, 247, 0.2)"
                : "transparent",
              borderRadius: "10px",
              border: isCurrentMatch
                ? "2px solid rgba(216, 180, 254, 0.8)"
                : isHighlighted || isSelected
                ? "1px solid rgba(168, 85, 247, 0.4)"
                : "none",
              boxShadow: isCurrentMatch
                ? "0 0 25px rgba(168, 85, 247, 0.5)"
                : "none",
              backdropFilter: isVisualFocus ? "blur(8px)" : "none",
            }}
          >
            {node.name}
          </div>
        </Html>

        <mesh onClick={handleClick}>
          <sphereGeometry args={[isSelected ? 0.3 : 0.15, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isVisualFocus ? 0.8 : 0.4}
          />
        </mesh>

        {/* Subtle glow ring for focused nodes */}
        {(isSelected || isCurrentMatch) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        )}
      </group>
    </Float>
  );
}

// Edge component with glowing aesthetic
function Edge({
  start,
  end,
  strength,
}: {
  start: [number, number, number];
  end: [number, number, number];
  strength: number;
}) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  return (
    <Line
      points={points}
      color="#3b82f6"
      lineWidth={strength * 1.5}
      transparent
      opacity={0.2}
      dashed={false}
    />
  );
}

// Main 3D scene
function Scene({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
  activeSearch,
  searchMatchIndex,
}: KnowledgeGraph3DProps) {
  const { camera } = useThree();
  const controlsRef = useRef<CameraControls>(null);

  // Categorical Clustered Layout Logic
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();

    const centerNodeId =
      selectedNodeId || (nodes.length > 0 ? nodes[0].id : undefined);
    if (!centerNodeId) return positions;

    // Group nodes by category
    const categoryGroups = new Map<string, string[]>();
    nodes.forEach((node) => {
      const cat = node.category || "General";
      if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
      categoryGroups.get(cat)!.push(node.id);
    });

    const categories = Array.from(categoryGroups.keys());
    const catPositions = new Map<string, THREE.Vector3>();

    // Identify directly connected nodes to the center for tighter layout
    const directNeighbors = new Set(
      edges
        .filter((e) => e.source === centerNodeId || e.target === centerNodeId)
        .map((e) => (e.source === centerNodeId ? e.target : e.source))
    );

    console.log(
      `[KnowledgeGraph3D] Layout: center=${centerNodeId}, neighbors=${directNeighbors.size}`
    );

    // Assign a center for each category arranged in a large 3D sphere
    categories.forEach((cat, index) => {
      // The category containing the selected node stays at the center region
      if (nodes.find((n) => n.id === centerNodeId)?.category === cat) {
        catPositions.set(cat, new THREE.Vector3(0, 0, 0));
        return;
      }

      const phi = Math.acos(1 - (2 * (index + 0.5)) / categories.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      const radius = selectedNodeId ? 5 : 35; // Dynamically tighten the graph when a node is selected

      catPositions.set(
        cat,
        new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        )
      );
    });

    nodes.forEach((node) => {
      if (node.id === centerNodeId) {
        positions.set(node.id, [0, 0, 0]);
        return;
      }

      const catCenter = catPositions.get(node.category || "General")!;
      const clusterNodes = categoryGroups.get(node.category || "General")!;
      const nodeIndex = clusterNodes.indexOf(node.id);

      const phi = Math.acos(1 - (2 * (nodeIndex + 0.5)) / clusterNodes.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * nodeIndex;

      // Neighbors are pulled in close, but spread out more as their count increases to handle density
      let offsetRadius;
      if (directNeighbors.has(node.id)) {
        const neighborCount = directNeighbors.size;
        if (selectedNodeId) {
          // Base distance of 5.0 as requested, scales up with the number of neighbors to avoid overcrowding
          const spreadFactor = Math.max(0, neighborCount - 10) * 0.2;
          offsetRadius = 5.0 + spreadFactor + Math.random() * 0.3;
        } else {
          // Default behavior for root view or non-exclusive focus
          const spreadFactor = Math.min(neighborCount * 0.15, 4.5);
          offsetRadius = 2.5 + spreadFactor + Math.random() * 0.5;
        }
      } else if (
        nodes.find((n) => n.id === centerNodeId)?.category ===
        (node.category || "General")
      ) {
        offsetRadius = 4.0 + Math.random() * 2.0;
      } else {
        offsetRadius = 6.0 + Math.random() * 3.0;
      }

      const pos = catCenter
        .clone()
        .add(
          new THREE.Vector3(
            offsetRadius * Math.sin(phi) * Math.cos(theta),
            offsetRadius * Math.sin(phi) * Math.sin(theta),
            offsetRadius * Math.cos(phi)
          )
        );

      positions.set(node.id, [pos.x, pos.y, pos.z]);
    });

    return positions;
  }, [nodes, edges, selectedNodeId]);

  // Center on search results traversal
  useEffect(() => {
    const search = activeSearch?.trim().toLowerCase();
    if (!search || !controlsRef.current || nodePositions.size === 0) return;

    const matches = nodes.filter((n) => n.name.toLowerCase().includes(search));

    if (matches.length > 0) {
      const index = (searchMatchIndex || 0) % matches.length;
      const match = matches[index];
      const pos = nodePositions.get(match.id);

      if (pos) {
        console.log(
          `[KnowledgeGraph3D] 🎯 Focus: ${index + 1}/${matches.length} - ${
            match.name
          }`
        );
        controlsRef.current.setLookAt(
          pos[0],
          pos[1],
          pos[2] + 12,
          pos[0],
          pos[1],
          pos[2],
          true
        );
      }
    }
  }, [activeSearch, searchMatchIndex, nodes, nodePositions]);

  // Smooth camera transition when selected node changes
  useEffect(() => {
    // We use a small timeout to ensure the controls are fully ready and the canvas has settled
    const timer = setTimeout(() => {
      if (controlsRef.current && selectedNodeId) {
        const pos = nodePositions.get(selectedNodeId);
        if (pos) {
          // Identify neighbor count for focal scaling
          const neighborCount = edges.filter(
            (e) => e.source === selectedNodeId || e.target === selectedNodeId
          ).length;

          const focalDistance = Math.min(4.0 + neighborCount * 0.18, 12);

          controlsRef.current.setLookAt(
            pos[0],
            pos[1],
            pos[2] + focalDistance, // Dynamically adjusted camera distance
            pos[0],
            pos[1],
            pos[2], // Target
            true // Animate
          );
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedNodeId, nodePositions, edges]);

  // Configure controls for map-like navigation (Left Click Pan)
  useEffect(() => {
    if (controlsRef.current) {
      // 1: Rotate, 2: Truck (Pan), 4: Dolly (Zoom), 8: Zoom
      controlsRef.current.mouseButtons.left = 2; // Default to Pan
      controlsRef.current.mouseButtons.right = 1; // Orbit
      controlsRef.current.mouseButtons.middle = 0; // Disable middle click pan/orbit

      // Also adjust touch controls for consistency
      controlsRef.current.touches.one = 32; // TRUCK (Pan)
      controlsRef.current.touches.two = 512; // TOUCH_ZOOM_ROTATE
    }
  }, []);

  // Custom listeners for Ctrl modifier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" && controlsRef.current) {
        controlsRef.current.mouseButtons.left = 1; // Switch to Orbit
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" && controlsRef.current) {
        controlsRef.current.mouseButtons.left = 2; // Back to Pan
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Custom wheel listener for Ctrl + Scroll orbit
    const canvas = document.querySelector("canvas");
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey && controlsRef.current) {
        e.preventDefault();
        controlsRef.current.rotate(
          e.deltaY * 0.05 * THREE.MathUtils.DEG2RAD,
          0,
          true
        );
      }
    };

    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (canvas) {
        canvas.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  return (
    <>
      <CameraControls
        ref={controlsRef}
        minDistance={2}
        maxDistance={40}
        makeDefault
        smoothTime={0.25}
      />

      <SpaceBackground />
      <FloatingParticles count={200} />
      <FloatingClouds />

      <group>
        {/* Render all edges first */}
        {edges.map((edge, index) => {
          const startPos = nodePositions.get(edge.source);
          const endPos = nodePositions.get(edge.target);
          if (!startPos || !endPos) return null;
          return (
            <Edge
              key={`edge-${index}`}
              start={startPos}
              end={endPos}
              strength={edge.strength}
            />
          );
        })}

        {/* Render all nodes */}
        {(() => {
          const search = activeSearch?.trim().toLowerCase();
          const matches = search
            ? nodes.filter((n) => n.name.toLowerCase().includes(search))
            : [];
          const currentMatchId =
            matches.length > 0
              ? matches[(searchMatchIndex || 0) % matches.length].id
              : null;

          return nodes.map((node) => {
            const position = nodePositions.get(node.id);
            if (!position) return null;

            const isSearching = !!search;
            const isHighlighted = isSearching
              ? node.name.toLowerCase().includes(search!)
              : false;
            const isCurrentMatch = node.id === currentMatchId;

            return (
              <Node
                key={node.id}
                node={node}
                position={position}
                isSelected={node.id === selectedNodeId}
                isHighlighted={isHighlighted}
                isCurrentMatch={isCurrentMatch}
                isSearching={isSearching}
                onClick={() => onNodeClick?.(node)}
              />
            );
          });
        })()}
      </group>
    </>
  );
}

export default function KnowledgeGraph3D(props: KnowledgeGraph3DProps) {
  const [hasError, setHasError] = useState(false);

  const handleCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      setHasError(true);
    };
    const onRestored = () => setHasError(false);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #020617 0%, #0f172a 50%, #1e1b4b 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={handleCreated}
      >
        <Scene {...props} />
      </Canvas>

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/90 z-20 backdrop-blur-md">
          <div className="text-center p-8 bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl">
            <h3 className="text-white font-bold text-xl mb-4">
              Graphics Context Lost
            </h3>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* Modern UI overlay for navigation hints */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-[10px] text-gray-400 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 flex items-center justify-center bg-white/10 rounded text-[8px]">
            LMB
          </span>
          <span>
            <b>Left Drag:</b> Pan Navigation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 flex items-center justify-center bg-white/10 rounded text-[8px]">
            RMB
          </span>
          <span>
            <b>Right Drag:</b> Orbit Around Space
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1 py-0.5 bg-white/10 rounded text-[7px] font-bold">
            CTRL + 🔍
          </span>
          <span>
            <b>Ctrl + Scroll:</b> Quick Orbit
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 flex items-center justify-center bg-white/10 rounded text-[8px]">
            RMB
          </span>
          <span>
            <b>Right Drag:</b> Full Orbit
          </span>
        </div>
      </div>
    </div>
  );
}
