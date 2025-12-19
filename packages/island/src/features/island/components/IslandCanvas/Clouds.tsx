"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CloudInstanceProps {
  position: [number, number, number];
  scale: [number, number, number];
  speedOffset: number;
}

const CloudInstance = ({
  position,
  scale,
  speedOffset,
}: CloudInstanceProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create an odd, random structure for each cloud
  const cloudParts = useMemo(() => {
    const parts = [];
    const numParts = 6 + Math.floor(Math.random() * 8); // More parts for complexity
    for (let i = 0; i < numParts; i++) {
      const isBox = Math.random() > 0.5;
      parts.push({
        type: isBox ? "box" : "sphere",
        position: [
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 4,
        ] as [number, number, number],
        // Non-uniform scaling for odd shapes
        scale: [
          0.5 + Math.random() * 2.5,
          0.2 + Math.random() * 1.2, // Flatter shapes usually look more like clouds
          0.5 + Math.random() * 2.5,
        ] as [number, number, number],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ] as [number, number, number],
      });
    }
    return parts;
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {cloudParts.map((part, i) => (
        <mesh
          key={i}
          position={part.position}
          scale={part.scale}
          rotation={part.rotation}
        >
          {part.type === "box" ? (
            <boxGeometry args={[1, 1, 1]} />
          ) : (
            <sphereGeometry args={[1, 12, 12]} />
          )}
          <meshStandardMaterial
            color="white"
            transparent
            opacity={0.25}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

const Clouds = () => {
  const cloudsRef = useRef<THREE.Group>(null);
  const windState = useRef({
    direction: new THREE.Vector3(1, 0, 0.5).normalize(),
    speed: 0.02,
    targetSpeed: 0.02,
    lastChange: 0,
  });

  const numClouds = useMemo(() => 40 + Math.floor(Math.random() * 20), []);

  const cloudData = useMemo(() => {
    return Array.from({ length: numClouds }).map(() => ({
      position: [
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 100, // Wide Y range
        (Math.random() - 0.5) * 300,
      ] as [number, number, number],
      scale: (2 + Math.random() * 4) as any,
      speedOffset: 0.8 + Math.random() * 0.4,
    }));
  }, [numClouds]);

  const BOUNDS = 200; // Half-size of the wrapping box

  useFrame((state) => {
    if (!cloudsRef.current) return;

    const time = state.clock.getElapsedTime();
    const camPos = state.camera.position;

    // Randomly change wind speed and direction slightly over time
    if (time - windState.current.lastChange > 10) {
      windState.current.targetSpeed = 0.01 + Math.random() * 0.03;
      const angle = (Math.random() - 0.5) * 0.5;
      windState.current.direction.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        angle
      );
      windState.current.lastChange = time;
    }

    // Lerp speed
    windState.current.speed +=
      (windState.current.targetSpeed - windState.current.speed) * 0.01;

    cloudsRef.current.children.forEach((child, i) => {
      const data = cloudData[i];
      if (!data) return;

      const moveVec = windState.current.direction
        .clone()
        .multiplyScalar(windState.current.speed * data.speedOffset);
      child.position.add(moveVec);

      // Camera-relative wrapping for infinite area feel
      if (child.position.x > camPos.x + BOUNDS) child.position.x -= BOUNDS * 2;
      if (child.position.x < camPos.x - BOUNDS) child.position.x += BOUNDS * 2;

      if (child.position.y > camPos.y + BOUNDS * 0.5)
        child.position.y -= BOUNDS;
      if (child.position.y < camPos.y - BOUNDS * 0.5)
        child.position.y += BOUNDS;

      if (child.position.z > camPos.z + BOUNDS) child.position.z -= BOUNDS * 2;
      if (child.position.z < camPos.z - BOUNDS) child.position.z += BOUNDS * 2;

      // Subtle float oscillation
      child.position.y += Math.sin(time * 0.5 + i) * 0.01;
    });
  });

  return (
    <group ref={cloudsRef}>
      {cloudData.map((data, i) => (
        <CloudInstance key={i} {...data} />
      ))}
    </group>
  );
};

export default Clouds;
