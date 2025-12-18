"use client";

import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import Island from "./Island";
import CameraControls, { type CameraControlsHandle } from "./CameraControls";
import {
  IslandIndicatorTracker,
  IslandIndicatorsOverlay,
  type OffscreenIsland,
} from "./IslandIndicators";

export interface IslandData {
  id: string;
  genre: string;
  theme: string;
  position: [number, number, number];
  gridSize: number;
  name?: string;
  level?: number;
}

interface PlacedObject {
  x: number;
  y: number;
  z: number;
  node: React.ReactNode;
}

interface IslandManaState {
  manaRate: number;
  accumulatedMana: number;
}

interface IslandCanvasProps {
  islands: IslandData[];
  isDraggingItem?: boolean;
  isDraggingPlacedItem?: boolean;
  onCellDrop?: (islandId: string, cellId: string, x: number, z: number) => void;
  placedObjects?: Record<string, PlacedObject & { islandId?: string }>;
  controlsRef: React.RefObject<CameraControlsHandle | null>;
  onCameraChanged?: (isAtDefault: boolean) => void;
  offscreenIslands?: OffscreenIsland[];
  onOffscreenIslandsChange?: (islands: OffscreenIsland[]) => void;
  // Mana-related props
  islandManaStates?: Record<string, IslandManaState>;
  onIslandClick?: (islandId: string) => void;
}

const IslandCanvas = ({
  islands,
  isDraggingItem = false,
  isDraggingPlacedItem = false,
  onCellDrop,
  placedObjects = {},
  controlsRef,
  onCameraChanged,
  offscreenIslands = [],
  onOffscreenIslandsChange,
  islandManaStates = {},
  onIslandClick,
}: IslandCanvasProps) => {
  const defaultCameraPos: [number, number, number] = [10, 15, 5];
  const defaultTarget: [number, number, number] = [0, 0, 0];

  // Track hovered island
  const [hoveredIslandId, setHoveredIslandId] = useState<string | null>(null);

  return (
    <div className="relative h-full w-full">
      <Canvas shadows camera={{ position: defaultCameraPos, fov: 50 }}>
        {/* lights + environment */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow />
        <hemisphereLight args={["#87CEEB", "#A8A060", 0.6]} />

        {/* islands */}
        {islands.map((island) => {
          const islandPlacedObjects = Object.entries(placedObjects)
            .filter(([_, obj]) => obj.islandId === island.id)
            .reduce((acc, [key, obj]) => ({ ...acc, [key]: obj }), {});

          const itemCount = Object.keys(islandPlacedObjects).length;
          const manaState = islandManaStates[island.id] || {
            manaRate: 9,
            accumulatedMana: 0,
          };

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
              // Mana-related props
              islandId={island.id}
              islandName={island.name || "My Island"}
              islandGenre={island.genre}
              islandTheme={island.theme}
              islandLevel={island.level || 1}
              manaRate={manaState.manaRate}
              accumulatedMana={manaState.accumulatedMana}
              itemCount={itemCount}
              isHovered={hoveredIslandId === island.id}
              onIslandHover={(isHovered) => {
                setHoveredIslandId(isHovered ? island.id : null);
              }}
              onIslandClick={() => {
                onIslandClick?.(island.id);
              }}
              showManaAura={islandManaStates[island.id]?.accumulatedMana > 1000}
            />
          );
        })}

        {/* Track off-screen islands */}
        {onOffscreenIslandsChange && (
          <IslandIndicatorTracker
            islands={islands.map((i) => ({ id: i.id, position: i.position }))}
            onUpdate={onOffscreenIslandsChange}
          />
        )}

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

      {/* Off-screen island indicators overlay */}
      <IslandIndicatorsOverlay offscreenIslands={offscreenIslands} />
    </div>
  );
};

export default IslandCanvas;
