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
  onClick 
}: { 
  node: GraphNode; 
  position: [number, number, number]; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = React.useState(false);
  const [justClicked, setJustClicked] = React.useState(false);

  // Subtle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

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
  endRadius = 0.1
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
    const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
    
    // Shorten line by node radius on both ends so it connects to sphere edge
    const adjustedStart = startVec.clone().add(direction.clone().multiplyScalar(startRadius));
    const adjustedEnd = endVec.clone().sub(direction.clone().multiplyScalar(endRadius));
    
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
function Scene({ nodes, edges, onNodeClick, selectedNodeId }: KnowledgeGraph3DProps) {
  // Calculate 3D positions in orbital/spherical arrangement
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    const radius = 5;

    nodes.forEach((node, index) => {
      const totalNodes = nodes.length;
      
      // Distribute nodes evenly on a sphere using Fibonacci sphere algorithm
      const phi = Math.acos(1 - 2 * (index + 0.5) / totalNodes);
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

// Main export component
export default function KnowledgeGraph3D(props: KnowledgeGraph3DProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Wait for client-side mount before rendering Canvas
  useEffect(() => {
    // Small delay to ensure WebGL context is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle WebGL context loss/restore
  const handleCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.log('WebGL context lost, waiting for restore...');
      setHasError(true);
    });
    
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      setHasError(false);
    });
  };

  if (!isReady) {
    return (
      <div className="w-full h-full bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-gray-400">Loading 3D graph...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full h-full bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-yellow-400 mb-2">⚠️ WebGL context lost</p>
          <p className="text-gray-400 text-sm">Restoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-950">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={handleCreated}
      >
        <color attach="background" args={["#030712"]} />
        <Scene {...props} />
      </Canvas>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-xs text-gray-300">
        <p>🖱️ <strong>Left drag:</strong> Rotate</p>
        <p>🖱️ <strong>Right drag:</strong> Pan</p>
        <p>🖱️ <strong>Scroll:</strong> Zoom</p>
        <p>🎯 <strong>Click node:</strong> Drill down</p>
      </div>
    </div>
  );
}
