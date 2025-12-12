"use client";

import { Canvas } from "@react-three/fiber";
import React, { useRef } from "react";
import Island from "./Island";
import CameraControls, { type CameraControlsHandle } from "./CameraControls";

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
  controlsRef: React.RefObject<CameraControlsHandle | null>;
  onCameraChanged?: (isAtDefault: boolean) => void;
}

const IslandCanvas = ({
  islands,
  isDraggingItem = false,
  isDraggingPlacedItem = false,
  onCellDrop,
  placedObjects = {},
  controlsRef,
  onCameraChanged,
}: IslandCanvasProps) => {
  const defaultCameraPos: [number, number, number] = [10, 15, 5];
  const defaultTarget: [number, number, number] = [0, 0, 0];

  return (
    <div className="relative h-full w-full">
      <Canvas shadows camera={{ position: defaultCameraPos, fov: 50 }}>
        {/* lights + environment */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={1.2}
          castShadow
        />
        <hemisphereLight args={["#87CEEB", "#A8A060", 0.6]} />

        {/* islands */}
        {islands.map((island) => {
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
                onCellDrop?.(island.id, cellId, x, z);
              }}
              placedObjects={islandPlacedObjects}
            />
          );
        })}

        {/* Orbit Controls with ref */}
        <CameraControls
          ref={controlsRef}
          isDraggingPlacedItem={isDraggingPlacedItem}
          defaultPosition={defaultCameraPos}
          defaultTarget={defaultTarget}
          onCameraChanged={onCameraChanged}
        />

        <fog attach="fog" args={["#B0E0E6", 15, 50]} />
      </Canvas>
    </div>
  );
};


export default IslandCanvas;
