"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import type { GraphNode, GraphEdge } from "@/app/api/knowledge-graph/route";

interface KnowledgeGraph3DProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string;
}

// Individual node component with interactive text (no sphere)
function Node({
  node,
  position,
  isSelected,
  onClick,
}: {
  node: GraphNode;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = React.useState(false);
  const [justClicked, setJustClicked] = React.useState(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    setJustClicked(true);
    onClick();
    // Reset red flash after 200ms
    setTimeout(() => setJustClicked(false), 200);
  };

  // Color logic: red when just clicked, purple when selected (center), white default
  const textColor = justClicked ? "#ef4444" : isSelected ? "#a855f7" : "white";
  const fontSize = isSelected ? 0.25 : 0.18;

  return (
    <group ref={groupRef} position={position}>
      {/* Interactive text label (no sphere) */}
      <Text
        position={[0, 0, 0]}
        fontSize={fontSize}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {node.name}
      </Text>

      {/* Glow effect when hovered */}
      {hovered && (
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[1.5, 0.3]} />
          <meshBasicMaterial color={textColor} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}

// Edge/connection line component
function Edge({
  start,
  end,
  strength,
  startRadius = 0.1,
  endRadius = 0.1,
}: {
  start: [number, number, number];
  end: [number, number, number];
  strength: number;
  startRadius?: number;
  endRadius?: number;
}) {
  const points = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);

    // Calculate direction from start to end
    const direction = new THREE.Vector3()
      .subVectors(endVec, startVec)
      .normalize();

    // Shorten line by node radius on both ends so it connects to sphere edge
    const adjustedStart = startVec
      .clone()
      .add(direction.clone().multiplyScalar(startRadius));
    const adjustedEnd = endVec
      .clone()
      .sub(direction.clone().multiplyScalar(endRadius));

    return [adjustedStart, adjustedEnd];
  }, [start, end, startRadius, endRadius]);

  return (
    <Line
      points={points}
      color="#4ade80"
      lineWidth={strength * 2}
      transparent
      opacity={0.3}
    />
  );
}

// Main 3D scene
function Scene({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: KnowledgeGraph3DProps) {
  // Calculate 3D positions in orbital/spherical arrangement
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    const radius = 5;

    nodes.forEach((node, index) => {
      const totalNodes = nodes.length;

      // Distribute nodes evenly on a sphere using Fibonacci sphere algorithm
      const phi = Math.acos(1 - (2 * (index + 0.5)) / totalNodes);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions.set(node.id, [x, y, z]);
    });

    return positions;
  }, [nodes]);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />

      <AnimationController>
        {/* Render all edges */}
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
              startRadius={0.1}
              endRadius={0.1}
            />
          );
        })}

        {/* Render all nodes */}
        {nodes.map((node) => {
          const position = nodePositions.get(node.id);
          if (!position) return null;

          return (
            <Node
              key={node.id}
              node={node}
              position={position}
              isSelected={node.id === selectedNodeId}
              onClick={() => onNodeClick?.(node)}
            />
          );
        })}
      </AnimationController>

      {/* Camera controls - allows user to rotate and zoom */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// Optimization Wrapper: Centralized Animation Controller
function AnimationController({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const { elapsedTime } = state.clock;
      // Animate all nodes at once via their parent group's position/rotation
      // Or we can iterate children if we want individual offsets
      groupRef.current.children.forEach((child, i) => {
        if (child.type === "Group") {
          // Access the original base position stored in userData or similar
          // For simplicity in this specific setup, we'll just give the whole group a slight sway
          child.position.y += Math.sin(elapsedTime * 0.5 + i) * 0.001;
        }
      });
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// Main export component
export default function KnowledgeGraph3D(props: KnowledgeGraph3DProps) {
  // Handle WebGL context loss/restore
  const handleCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;

    const onLost = (e: Event) => {
      e.preventDefault();
      console.log("WebGL context lost, waiting for restore...");
      setHasError(true);
    };

    const onRestored = () => {
      console.log("WebGL context restored");
      setHasError(false);
    };

    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  };

  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-full h-full bg-gray-950 relative overflow-hidden">
      {/* The Canvas stays mounted so it can receive the 'webglcontextrestored' event */}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        dpr={Math.min(
          2,
          typeof window !== "undefined" ? window.devicePixelRatio : 1
        )}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          // preserveDrawingBuffer helps with some context loss edge cases
          preserveDrawingBuffer: true,
        }}
        onCreated={handleCreated}
      >
        <color attach="background" args={["#030712"]} />
        <Scene {...props} />
      </Canvas>

      {/* Error Overlay (Only shows if context is lost) */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/90 z-20 backdrop-blur-md">
          <div className="text-center p-8 bg-gray-900 border border-yellow-500/30 rounded-2xl shadow-2xl max-w-sm mx-4">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-2">
              Graphics Context Lost
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Your browser reclaimed the 3D memory. This usually happens if you
              have too many tabs open or your GPU is busy.
            </p>
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-500 animate-pulse">
                Waiting for browser to restore...
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg active:scale-95"
              >
                Reload Page Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {!hasError && (
        <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-xs text-gray-300 pointer-events-none transition-opacity duration-500">
          <p>
            🖱️ <strong>Left drag:</strong> Rotate
          </p>
          <p>
            🖱️ <strong>Right drag:</strong> Pan
          </p>
          <p>
            🖱️ <strong>Scroll:</strong> Zoom
          </p>
          <p>
            🎯 <strong>Click node:</strong> Drill down
          </p>
        </div>
      )}
    </div>
  );
}
