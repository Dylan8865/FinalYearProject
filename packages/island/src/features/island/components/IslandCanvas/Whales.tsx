"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";

const MODEL_PATH = "/models/humpback_whale.glb";

interface WhaleProps {
  id: number;
  position: [number, number, number];
  scale: number;
  speed: number;
  islandAvoidanceData: { position: [number, number, number]; radius: number }[];
  otherWhalesRefs: React.MutableRefObject<Record<number, THREE.Vector3>>;
}

const WhaleInstance = ({
  id,
  position,
  scale,
  speed,
  islandAvoidanceData,
  otherWhalesRefs,
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

  // Use a manual mixer
  const mixer = useMemo(
    () => new THREE.AnimationMixer(clonedScene),
    [clonedScene]
  );

  useEffect(() => {
    if (animations && animations.length > 0) {
      animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
        action.setEffectiveTimeScale(0.4);
      });
    }
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, animations]);

  // --- UNIQUE BRAIN STATE PER WHALE ---
  // We use separate phases and frequencies so they don't oscillate at the same time
  const phaseX = useRef(Math.random() * Math.PI * 2);
  const phaseY = useRef(Math.random() * Math.PI * 2);
  const phaseZ = useRef(Math.random() * Math.PI * 2);

  const freqX = useRef(0.05 + Math.random() * 0.05);
  const freqY = useRef(0.03 + Math.random() * 0.04);
  const freqZ = useRef(0.05 + Math.random() * 0.05);

  const velocity = useRef(
    new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    )
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update Animation
    mixer.update(delta);

    // Update shared position for social awareness
    otherWhalesRefs.current[id] = currentPos.current;

    /** 1. UNIQUE 3D WANDERING (De-synchronized)
     * We increment each phase by its own random frequency.
     * This ensures one whale might be turning left while another dives,
     * and they will never "sync up" over time.
     */
    phaseX.current += delta * freqX.current;
    phaseY.current += delta * freqY.current;
    phaseZ.current += delta * freqZ.current;

    // Add gentle steering forces
    velocity.current.x += Math.sin(phaseX.current) * 0.008;
    velocity.current.y += Math.sin(phaseY.current) * 0.006;
    velocity.current.z += Math.cos(phaseZ.current) * 0.008;

    /** 2. ISLAND AVOIDANCE
     * Steer away from islands to prevent clipping
     */
    islandAvoidanceData.forEach((island) => {
      const islandPos = new THREE.Vector3(...island.position);
      const dist = currentPos.current.distanceTo(islandPos);
      const safeDist = island.radius + 50;

      if (dist < safeDist) {
        const pushDir = currentPos.current.clone().sub(islandPos).normalize();
        const force = (safeDist - dist) / safeDist;
        velocity.current.add(pushDir.multiplyScalar(force * 0.15));
      }
    });

    /** 3. SOCIAL INTERACTION (Enhanced Attraction)
     * We've increased the attraction weight (0.015) so they actually try to meet.
     */
    Object.entries(otherWhalesRefs.current).forEach(
      ([otherIdStr, otherPos]) => {
        const otherIdNum = parseInt(otherIdStr);
        if (otherIdNum === id) return;

        const dist = currentPos.current.distanceTo(otherPos);

        // Separation: Give each other room
        if (dist < 60) {
          const avoidDir = currentPos.current.clone().sub(otherPos).normalize();
          velocity.current.add(avoidDir.multiplyScalar(0.04));
        }

        // Cohesion: Drift towards friends if they are moderately nearby
        if (dist > 80 && dist < 300) {
          const attractDir = otherPos
            .clone()
            .sub(currentPos.current)
            .normalize();
          // Weight is now higher to encourage social clusters
          velocity.current.add(attractDir.multiplyScalar(0.015));
        }
      }
    );

    // Clamp speed to keep movement majestic and slow
    const maxSpeedLimit = 0.1;
    if (velocity.current.length() > maxSpeedLimit) {
      velocity.current.setLength(maxSpeedLimit);
    }
    if (velocity.current.length() < 0.02) {
      velocity.current.setLength(0.02);
    }

    // Apply movement
    currentPos.current.add(velocity.current.clone().multiplyScalar(delta * 25));

    /** 4. INFINITE 3D VIEWPORT BUBBLE (Focusing on the user)
     */
    const camPos = state.camera.position;
    const BOUNDS = 900;

    if (currentPos.current.x > camPos.x + BOUNDS)
      currentPos.current.x -= BOUNDS * 2;
    if (currentPos.current.x < camPos.x - BOUNDS)
      currentPos.current.x += BOUNDS * 2;
    if (currentPos.current.z > camPos.z + BOUNDS)
      currentPos.current.z -= BOUNDS * 2;
    if (currentPos.current.z < camPos.z - BOUNDS)
      currentPos.current.z += BOUNDS * 2;
    if (currentPos.current.y > camPos.y + BOUNDS)
      currentPos.current.y -= BOUNDS * 2;
    if (currentPos.current.y < camPos.y - BOUNDS)
      currentPos.current.y += BOUNDS * 2;

    groupRef.current.position.copy(currentPos.current);

    /** 5. SMOOTH 3D ROTATION
     */
    if (velocity.current.lengthSq() > 0.0001) {
      const targetLookAt = currentPos.current.clone().add(velocity.current);
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
    >
      <group rotation={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
};

interface WhalesProps {
  islands?: { position: [number, number, number]; gridSize: number }[];
}

const Whales = ({ islands = [] }: WhalesProps) => {
  const otherWhalesRefs = useRef<Record<number, THREE.Vector3>>({});

  const islandAvoidanceData = useMemo(() => {
    return islands.map((i) => ({
      position: i.position,
      radius: (i.gridSize * 1.2) / 2,
    }));
  }, [islands]);

  const whaleData = useMemo(() => {
    const numWhales = 4;
    return Array.from({ length: numWhales }).map((_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 1200,
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 1200,
      ] as [number, number, number],
      scale: 15 + Math.random() * 12,
      speed: 0.1,
    }));
  }, []);

  return (
    <group>
      {whaleData.map((data) => (
        <WhaleInstance
          key={data.id}
          {...data}
          islandAvoidanceData={islandAvoidanceData}
          otherWhalesRefs={otherWhalesRefs}
        />
      ))}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);

export default Whales;
