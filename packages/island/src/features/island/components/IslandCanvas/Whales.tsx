"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";

const MODEL_PATH = "/models/humpback_whale.glb";

const playWhaleSound = (frequency = 150) => {
  if (typeof window === "undefined") return;
  const audioCtx = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  oscillator.frequency.exponentialRampToValueAtTime(
    frequency * 1.5,
    audioCtx.currentTime + 1
  );
  oscillator.frequency.exponentialRampToValueAtTime(
    frequency * 0.8,
    audioCtx.currentTime + 3
  );

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.5);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 3);
};

interface WhaleProps {
  position: [number, number, number];
  scale: number;
  speed: number;
  islandAvoidanceData: { position: [number, number, number]; radius: number }[];
}

const WhaleInstance = ({
  position,
  scale,
  speed,
  islandAvoidanceData,
}: WhaleProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(...position));
  const [isHovered, setIsHovered] = useState(false);

  // Load the shared GLTF model
  const { scene, animations } = useGLTF(MODEL_PATH);

  // Clone the scene for this specific instance
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.frustumCulled = false;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Target the cloned scene directly for animations
  const { actions, names } = useAnimations(animations, clonedScene);

  // Movement state
  const velocity = useRef(
    new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5)
      .normalize()
      .multiplyScalar(0.05)
  );
  const angle = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    if (names.length > 0) {
      console.log("🐳 Whale Animations Detected:", names);
      // Play all animations by default, or just the first if it's the main loop
      names.forEach((name) => {
        const action = actions[name];
        if (action) {
          action.reset().fadeIn(0.5).play();
          action.setEffectiveTimeScale(0.3); // Slow motion swim
        }
      });
    } else {
      console.warn(
        "❌ No animations found in humpback_whale.glb. Ensure the file has animations."
      );
    }
  }, [actions, names]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // 1. Random Movement logic (Wandering)
    angle.current += delta * 0.05; // Even slower turn
    const wanderX = Math.cos(angle.current) * 0.01;
    const wanderZ = Math.sin(angle.current) * 0.01;

    velocity.current.x += wanderX;
    velocity.current.z += wanderZ;
    velocity.current.y += Math.sin(time * 0.1) * 0.0005;

    // 2. Island Avoidance
    islandAvoidanceData.forEach((island) => {
      const islandPos = new THREE.Vector3(...island.position);
      const dist = currentPos.current.distanceTo(islandPos);
      const safeDist = island.radius + 40;

      if (dist < safeDist) {
        const pushDir = currentPos.current.clone().sub(islandPos).normalize();
        const force = (safeDist - dist) / safeDist;
        velocity.current.add(pushDir.multiplyScalar(force * 0.05));
      }
    });

    // Extremely slow speed for giants
    const maxSpeedLimit = speed * 0.5; // speed prop is very low
    if (velocity.current.length() > maxSpeedLimit) {
      velocity.current.setLength(maxSpeedLimit);
    }
    if (velocity.current.length() < 0.02) {
      velocity.current.setLength(0.02);
    }

    // Apply movement
    currentPos.current.add(velocity.current.clone().multiplyScalar(delta * 20));

    // Bounds wrapping
    const worldSize = 500;
    if (currentPos.current.x > worldSize) currentPos.current.x = -worldSize;
    if (currentPos.current.x < -worldSize) currentPos.current.x = worldSize;
    if (currentPos.current.z > worldSize) currentPos.current.z = -worldSize;
    if (currentPos.current.z < -worldSize) currentPos.current.z = worldSize;
    if (currentPos.current.y > 180) currentPos.current.y = 180;
    if (currentPos.current.y < 20) currentPos.current.y = 20;

    groupRef.current.position.copy(currentPos.current);

    // 3. Look towards movement direction
    if (velocity.current.lengthSq() > 0.0001) {
      const targetLookAt = currentPos.current.clone().add(velocity.current);

      // Smoothly slerp the rotation for majestic turns
      const currentQuat = groupRef.current.quaternion.clone();
      groupRef.current.lookAt(targetLookAt);
      const targetQuat = groupRef.current.quaternion.clone();
      groupRef.current.quaternion.copy(currentQuat);
      groupRef.current.quaternion.slerp(targetQuat, delta * 1.5);
    }
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        playWhaleSound(60 + Math.random() * 30);
      }}
    >
      <group rotation={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </group>

      {/* Interaction hit box (invisible) since we disabled frustum culling */}
      <mesh visible={false}>
        <boxGeometry args={[4, 2, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

interface WhalesProps {
  islands?: { position: [number, number, number]; gridSize: number }[];
}

const Whales = ({ islands = [] }: WhalesProps) => {
  const islandAvoidanceData = useMemo(() => {
    return islands.map((i) => ({
      position: i.position,
      radius: (i.gridSize * 1.2) / 2,
    }));
  }, [islands]);

  const whaleData = useMemo(() => {
    const numWhales = 2;
    return Array.from({ length: numWhales }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 800,
        60 + Math.random() * 80,
        (Math.random() - 0.5) * 800,
      ] as [number, number, number],
      scale: 15 + Math.random() * 10, // Gigantic
      speed: 0.1, // Single slow speed constant
    }));
  }, []);

  return (
    <group>
      {whaleData.map((data, i) => (
        <WhaleInstance
          key={i}
          {...data}
          islandAvoidanceData={islandAvoidanceData}
        />
      ))}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);

export default Whales;
