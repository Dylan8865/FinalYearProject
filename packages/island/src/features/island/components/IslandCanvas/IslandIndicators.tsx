"use client";

import React, { useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface IslandPosition {
  id: string;
  position: [number, number, number];
}

interface OffscreenIsland {
  id: string;
  direction:
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  screenX: number;
  screenY: number;
  angle: number;
}

interface IslandIndicatorProps {
  islands: IslandPosition[];
  onIndicatorClick?: (direction: string) => void;
}

/**
 * Calculates which islands are off-screen and their directions
 */
const IslandIndicatorTracker = ({
  islands,
  onUpdate,
}: {
  islands: IslandPosition[];
  onUpdate: (offscreen: OffscreenIsland[]) => void;
}) => {
  const { camera, size } = useThree();

  useFrame(() => {
    const offscreenIslands: OffscreenIsland[] = [];
    const margin = 100; // Pixels from edge to consider "on screen"

    islands.forEach((island) => {
      const worldPos = new THREE.Vector3(
        island.position[0],
        island.position[1],
        island.position[2]
      );

      // Project to screen coordinates
      const screenPos = worldPos.clone().project(camera);

      // Convert from NDC (-1 to 1) to screen pixels
      const screenX = ((screenPos.x + 1) / 2) * size.width;
      const screenY = ((-screenPos.y + 1) / 2) * size.height;

      // Check if behind camera
      if (screenPos.z > 1) {
        // Island is behind camera, show on opposite side
        const direction = screenX < size.width / 2 ? "right" : "left";
        offscreenIslands.push({
          id: island.id,
          direction,
          screenX: direction === "left" ? margin : size.width - margin,
          screenY: size.height / 2,
          angle: direction === "left" ? 180 : 0,
        });
        return;
      }

      // Check if offscreen
      const isOffLeft = screenX < margin;
      const isOffRight = screenX > size.width - margin;
      const isOffTop = screenY < margin;
      const isOffBottom = screenY > size.height - margin;

      if (!isOffLeft && !isOffRight && !isOffTop && !isOffBottom) {
        return; // On screen
      }

      // Determine direction
      let direction: OffscreenIsland["direction"];
      if (isOffLeft && isOffTop) direction = "top-left";
      else if (isOffRight && isOffTop) direction = "top-right";
      else if (isOffLeft && isOffBottom) direction = "bottom-left";
      else if (isOffRight && isOffBottom) direction = "bottom-right";
      else if (isOffLeft) direction = "left";
      else if (isOffRight) direction = "right";
      else if (isOffTop) direction = "top";
      else direction = "bottom";

      // Calculate clamped position on screen edge
      const clampedX = Math.max(margin, Math.min(size.width - margin, screenX));
      const clampedY = Math.max(
        margin,
        Math.min(size.height - margin, screenY)
      );

      // Calculate angle pointing towards island
      const angle =
        Math.atan2(screenY - size.height / 2, screenX - size.width / 2) *
        (180 / Math.PI);

      offscreenIslands.push({
        id: island.id,
        direction,
        screenX: clampedX,
        screenY: clampedY,
        angle,
      });
    });

    onUpdate(offscreenIslands);
  });

  return null;
};

/**
 * Groups offscreen islands by direction and returns indicator data
 */
const groupByDirection = (offscreen: OffscreenIsland[]) => {
  const groups: Record<
    string,
    { count: number; x: number; y: number; angle: number }
  > = {};

  offscreen.forEach((island) => {
    if (!groups[island.direction]) {
      groups[island.direction] = {
        count: 0,
        x: island.screenX,
        y: island.screenY,
        angle: island.angle,
      };
    }
    groups[island.direction].count++;
    // Average the positions
    groups[island.direction].x =
      (groups[island.direction].x + island.screenX) / 2;
    groups[island.direction].y =
      (groups[island.direction].y + island.screenY) / 2;
  });

  return groups;
};

/**
 * Chevron indicator component (two lines joined like ">")
 */
const ArrowIndicator = ({
  x,
  y,
  angle,
  count,
  onClick,
}: {
  x: number;
  y: number;
  angle: number;
  count: number;
  onClick?: () => void;
}) => {
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 transform cursor-pointer select-none items-center justify-center transition-all hover:scale-110 hover:opacity-80"
      style={{
        left: x,
        top: y,
      }}
      onClick={onClick}
    >
      {/* Chevron container with rotation */}
      <div className="relative" style={{ transform: `rotate(${angle}deg)` }}>
        {/* Chevron shape - two lines joined at an angle */}
        <div className="relative h-6 w-6 opacity-60">
          {/* Top line of chevron */}
          <div
            className="absolute rounded-full bg-white"
            style={{
              width: "16px",
              height: "3px",
              top: "50%",
              left: "50%",
              transformOrigin: "left center",
              transform: "translate(-2px, -50%) rotate(-145deg)",
            }}
          />
          {/* Bottom line of chevron */}
          <div
            className="absolute rounded-full bg-white"
            style={{
              width: "16px",
              height: "3px",
              top: "50%",
              left: "50%",
              transformOrigin: "left center",
              transform: "translate(-2px, -50%) rotate(145deg)",
            }}
          />
        </div>
      </div>

      {/* Count badge */}
      {count > 1 && (
        <div className="absolute bottom-5 left-5 right-5 top-5 flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-xs font-bold text-gray-700">
          {count}
        </div>
      )}
    </div>
  );
};

/**
 * Island Indicators Overlay
 * Shows floating arrow indicators pointing to off-screen islands
 */
export const IslandIndicatorsOverlay = ({
  offscreenIslands,
  onIndicatorClick,
}: {
  offscreenIslands: OffscreenIsland[];
  onIndicatorClick?: (direction: string) => void;
}) => {
  const groups = groupByDirection(offscreenIslands);

  if (Object.keys(groups).length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {Object.entries(groups).map(([direction, data]) => (
        <div key={direction} className="pointer-events-auto">
          <ArrowIndicator
            x={data.x}
            y={data.y}
            angle={data.angle}
            count={data.count}
            onClick={() => onIndicatorClick?.(direction)}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook to track offscreen islands
 */
export const useOffscreenIslands = () => {
  const [offscreenIslands, setOffscreenIslands] = useState<OffscreenIsland[]>(
    []
  );

  const updateOffscreen = useCallback((islands: OffscreenIsland[]) => {
    setOffscreenIslands(islands);
  }, []);

  return { offscreenIslands, updateOffscreen };
};

export { IslandIndicatorTracker };
export type { OffscreenIsland, IslandPosition };
