"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Saturn = ({
  position,
  scale,
}: {
  position: [number, number, number];
  scale: number;
}) => {
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (planetRef.current) planetRef.current.rotation.y = t * 0.1;
    if (ringRef.current) ringRef.current.rotation.z = t * 0.05;
  });

  return (
    <group position={position} scale={scale} rotation={[0.4, 0, 0.4]}>
      {/* Planet Body */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#d2b48c" roughness={0.8} />
      </mesh>
      {/* Rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 2.2, 64]} />
        <meshStandardMaterial
          color="#c2a278"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

const BlackHole = ({
  position,
  scale,
}: {
  position: [number, number, number];
  scale: number;
}) => {
  const diskRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (diskRef.current) {
      diskRef.current.rotation.z = -t * 0.5;
      // Pulse the disk intensity
      if (diskRef.current.material instanceof THREE.MeshBasicMaterial) {
        diskRef.current.material.opacity = 0.4 + Math.sin(t * 2) * 0.1;
      }
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Event Horizon */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="black" />
      </mesh>
      {/* Accretion Disk */}
      <mesh ref={diskRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[1.2, 3, 64]} />
        <meshBasicMaterial
          color="#ff4500"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial color="#ff8c00" transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

const Sun = () => {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sunRef.current) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
      sunRef.current.scale.set(scale, scale, scale);
    }
    if (glowRef.current) {
      const glowScale =
        1.5 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
    }
  });

  return (
    <group position={[40, 60, 20]}>
      <mesh ref={sunRef}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshStandardMaterial
          color="#FFF5E1"
          emissive="#FFD700"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.15}
          toneMapped={false}
        />
      </mesh>
      <pointLight intensity={2} distance={100} color="#FFF5E1" />
    </group>
  );
};

const Stars = () => {
  const count = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 150;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  // Use vertex colors to handle the opacity gradient
  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      // Brighter at the top, fading towards the middle
      const factor = Math.max(0, y / 150);
      const intensity = Math.pow(factor, 3) * (0.2 + Math.random() * 0.8);

      cols[i * 3] = intensity; // R
      cols[i * 3 + 1] = intensity; // G
      cols[i * 3 + 2] = intensity; // B
    }
    return cols;
  }, [positions]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.7}
        vertexColors
        transparent
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};

const SpaceObjects = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Anchor the group to the camera position
      // This makes the objects appear infinitely far away as they move with the camera
      groupRef.current.position.copy(state.camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background Stars */}
      <Stars />

      {/* The Sun */}
      <Sun />

      {/* Distant Saturn-like planet */}
      <Saturn position={[-60, 30, -50]} scale={8} />

      {/* Distant mini-black hole */}
      <BlackHole position={[70, -20, -80]} scale={6} />

      {/* Distant "White Hole" or bright star */}
      <mesh position={[-100, 10, 40]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="white" />
        <pointLight intensity={10} distance={50} color="white" />
      </mesh>
    </group>
  );
};

export default SpaceObjects;
