"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import React from "react";
import Island from "./Island";

export interface IslandData {
  id: string;
  position: [number, number, number];
  gridSize: number;
}

interface PlacedObject {
  x: number;
  y: number;
  z: number;
  node: React.ReactNode;
}

interface IslandCanvasProps {
  islands: IslandData[];
  isDraggingItem?: boolean;
  isDraggingPlacedItem?: boolean;
  onCellDrop?: (islandId: string, cellId: string, x: number, z: number) => void;
  placedObjects?: Record<string, PlacedObject & { islandId?: string }>;
}

const IslandCanvas = ({
  islands,
  isDraggingItem = false,
  isDraggingPlacedItem = false,
  onCellDrop,
  placedObjects = {},
}: IslandCanvasProps) => {
  return (
    <div className="h-full w-full">
      <Canvas shadows camera={{ position: [10, 15, 5], fov: 50 }}>
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight
          position={[10, 15, 5]}
          intensity={1.2}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight args={["#87CEEB", "#A8A060", 0.6]} />

        {islands.map((island) => {
          // Filter placed objects for this specific island
          const islandPlacedObjects = Object.entries(placedObjects)
            .filter(([_, obj]) => obj.islandId === island.id)
            .reduce((acc, [key, obj]) => ({ ...acc, [key]: obj }), {});

          return (
            <Island
              key={island.id}
              gridSize={island.gridSize}
              position={island.position}
              animate={true}
              isDraggingItem={isDraggingItem}
              onCellDrop={(cellId, x, z) => {
                if (onCellDrop) {
                  console.log("🏝️ Island clicked:", island.id);
                  onCellDrop(island.id, cellId, x, z);
                }
              }}
              placedObjects={islandPlacedObjects}
            />
          );
        })}

        <OrbitControls
          enabled={!isDraggingPlacedItem}
          enablePan={!isDraggingPlacedItem}
          enableRotate={!isDraggingPlacedItem}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={Infinity}
          mouseButtons={{
            LEFT: 2,
            MIDDLE: 1,
            RIGHT: 0,
          }}
        />

        <fog attach="fog" args={["#B0E0E6", 15, 50]} />
      </Canvas>
    </div>
  );
};

export default IslandCanvas;
