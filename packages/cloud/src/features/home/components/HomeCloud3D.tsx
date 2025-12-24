"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Float, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  SpaceBackground,
  FloatingParticles,
  FloatingClouds,
} from "@/components/three/Environment3D";
import { CloudTopic } from "../hooks/useTopics";

interface HomeCloud3DProps {
  topics: CloudTopic[];
  onTopicClick?: (topic: string) => void;
  activeSearch?: string;
}

function TopicNode({
  topic,
  position,
  isHighlighted,
  onClick,
}: {
  topic: CloudTopic;
  position: [number, number, number];
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  // Scale based on weight
  const weightScale = Math.max(0.2, (topic.weight || 50) / 100);
  const fontSize =
    (0.2 + weightScale * 0.4) * (hovered || isHighlighted ? 1.2 : 1);
  const textColor = isHighlighted ? "#a855f7" : hovered ? "#3b82f6" : "white";

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={position}>
        <Html
          center
          distanceFactor={15}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "auto" }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            onMouseEnter={() => {
              setHovered(true);
              document.body.style.cursor = "pointer";
            }}
            onMouseLeave={() => {
              setHovered(false);
              document.body.style.cursor = "auto";
            }}
            style={{
              color: textColor,
              // Distance-based sizing is handled by distanceFactor,
              // but we can add weight-based base sizing
              fontSize: `${14 + weightScale * 12}px`,
              fontWeight: isHighlighted ? "800" : "500",
              whiteSpace: "nowrap",
              userSelect: "none",
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: hovered || isHighlighted ? "scale(1.2)" : "scale(1)",
              opacity: isHighlighted ? 1 : 0.8,
              padding: "4px 10px",
              background: isHighlighted
                ? "rgba(168, 85, 247, 0.2)"
                : "transparent",
              borderRadius: "6px",
              border: isHighlighted
                ? "1px solid rgba(168, 85, 247, 0.4)"
                : "none",
              backdropFilter: isHighlighted ? "blur(4px)" : "none",
            }}
          >
            {topic.text}
          </div>
        </Html>

        {/* Interactive glow sphere - remains 3D for depth reference */}
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          scale={hovered ? 1.5 : 1}
        >
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial
            color={textColor}
            transparent
            opacity={hovered ? 0.3 : 0.1}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Scene({ topics, onTopicClick, activeSearch }: HomeCloud3DProps) {
  const controlsRef = useRef<CameraControls>(null);

  const topicPositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();

    // Group nodes by category
    const categoryGroups = new Map<string, string[]>();
    topics.forEach((topic) => {
      const cat = topic.category || "General";
      if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
      categoryGroups.get(cat)!.push(topic.id);
    });

    const categories = Array.from(categoryGroups.keys());
    const catPositions = new Map<string, THREE.Vector3>();

    // Assign cluster centers in a 3D distribution with more space between them
    categories.forEach((cat, index) => {
      const phi = Math.acos(1 - (2 * (index + 0.5)) / categories.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      const radius = 25; // Increased from 8 to 25 for obvious distance

      catPositions.set(
        cat,
        new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        )
      );
    });

    topics.forEach((topic) => {
      const catCenter = catPositions.get(topic.category || "General")!;
      // Tighten the cluster volume (offsetRadius decreased from 3-5 to 1.5-3)
      const offsetRadius = 1.5 + Math.random() * 1.5;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      const x = offsetRadius * Math.sin(phi) * Math.cos(theta);
      const y = offsetRadius * Math.sin(phi) * Math.sin(theta);
      const z = offsetRadius * Math.cos(phi);

      const pos = catCenter.clone().add(new THREE.Vector3(x, y, z));
      positions.set(topic.id, [pos.x, pos.y, pos.z]);
    });

    return positions;
  }, [topics]);

  // Center on high-priority match if searching
  useEffect(() => {
    if (activeSearch && controlsRef.current) {
      const match = topics.find(
        (t) => t.text.toLowerCase() === activeSearch.toLowerCase()
      );
      if (match) {
        const pos = topicPositions.get(match.id);
        if (pos) {
          controlsRef.current.setLookAt(
            pos[0],
            pos[1],
            pos[2] + 10,
            pos[0],
            pos[1],
            pos[2],
            true
          );
        }
      }
    }
  }, [activeSearch, topics, topicPositions]);

  // Configure controls for map-like navigation (Left Click Pan)
  useEffect(() => {
    if (controlsRef.current) {
      // 1: Rotate, 2: Truck (Pan), 4: Dolly (Zoom), 8: Zoom
      controlsRef.current.mouseButtons.left = 2; // Default to Pan
      controlsRef.current.mouseButtons.right = 1; // Orbit
      controlsRef.current.mouseButtons.middle = 0;

      // Also adjust touch controls
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
        minDistance={5}
        maxDistance={50}
        makeDefault
        smoothTime={0.25}
      />

      <SpaceBackground />
      <FloatingParticles count={300} />
      <FloatingClouds />

      <group>
        {topics.map((topic) => {
          const position = topicPositions.get(topic.id);
          if (!position) return null;

          const isHighlighted = activeSearch
            ? topic.text.toLowerCase().includes(activeSearch.toLowerCase())
            : false;

          return (
            <TopicNode
              key={topic.id}
              topic={topic}
              position={position}
              isHighlighted={isHighlighted}
              onClick={() => onTopicClick?.(topic.text)}
            />
          );
        })}
      </group>
    </>
  );
}

export default function HomeCloud3D(props: HomeCloud3DProps) {
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
      className="w-full h-full relative"
      style={{
        background:
          "linear-gradient(to bottom, #020617 0%, #0f172a 50%, #1e1b4b 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 20], fov: 45 }}
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
        <div className="absolute inset-0 flex items-center justify-center bg-[#030712]/90 z-20 backdrop-blur-md">
          <div className="text-center p-8 bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl">
            <h3 className="text-white font-bold text-xl mb-4">
              Graphics Context Lost
            </h3>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold"
            >
              Recover
            </button>
          </div>
        </div>
      )}

      {/* Visual background gradient overlay to blend UI */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#030712]/50" />

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
            CTRL + �️
          </span>
          <span>
            <b>Ctrl + Drag:</b> Rotate Space
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1 py-0.5 bg-white/10 rounded text-[7px] font-bold">
            CTRL + �🔍
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
