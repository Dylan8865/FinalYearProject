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

interface IslandCanvasProps {
  islands: IslandData[];
}

const IslandCanvas = ({ islands }: IslandCanvasProps) => {
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

        {islands.map((island) => (
          <Island
            key={island.id}
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
