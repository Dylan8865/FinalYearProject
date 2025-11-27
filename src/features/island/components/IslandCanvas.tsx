/* eslint-disable react-hooks/purity */
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import React, { useMemo } from "react";
import Island from "./Island";

const IslandCanvas = () => {
  const islandPositions = useMemo(() => {
    const positions: Array<{
      position: [number, number, number];
      gridSize: number;
    }> = [];
    const minDistance = 8;

    for (let i = 0; i < 3; i++) {
      let position: [number, number, number];
      let attempts = 0;

      do {
        position = [
          (Math.random() - 0.5) * 20,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 20,
        ];
        attempts++;
      } while (
        positions.some((p) => {
          const dx = p.position[0] - position[0];
          const dy = p.position[1] - position[1];
          const dz = p.position[2] - position[2];
          return Math.sqrt(dx * dx + dy * dy + dz * dz) < minDistance;
        }) &&
        attempts < 50
      );

      positions.push({
        position,
        gridSize: Math.floor(Math.random() * 3) + 4,
      });
    }

    return positions;
  }, []);

  return (
    <div className="w-full h-full">
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

        {islandPositions.map((island, index) => (
          <Island
            key={index}
            gridSize={island.gridSize}
            position={island.position}
          />
        ))}

        <OrbitControls
          enablePan={true}
          enableRotate={true}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={30}
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
