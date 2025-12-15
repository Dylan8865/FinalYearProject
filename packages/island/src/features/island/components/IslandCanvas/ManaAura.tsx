"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MIN_MANA_FOR_AURA } from "@/utils/manaCalculations";

interface ManaAuraProps {
  accumulatedMana: number;
  manaRate: number;
  radius?: number;
  visible?: boolean;
}

/**
 * ManaAura Component
 *
 * A visual effect that appears around an island when mana is available to collect.
 * The aura becomes more intense as more mana accumulates.
 *
 * Features:
 * - Ethereal, cloudy white/blue glowing particles
 * - Intensity scales with accumulated mana
 * - Gentle pulsing animation
 * - Particle system for magical effect
 */
const ManaAura = ({
  accumulatedMana,
  manaRate,
  radius = 3,
  visible = true,
}: ManaAuraProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Calculate intensity based on accumulated mana
  // Max intensity at ~1 minute of accumulation (60 * manaRate)
  const maxMana = manaRate * 60;
  const intensity = Math.min(accumulatedMana / maxMana, 1);

  // Animate the aura
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    if (particlesRef.current) {
      // Pulsing effect
      const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      particlesRef.current.scale.setScalar(pulse);
    }
  });

  // Generate particle positions
  const particlePositions = useMemo(() => {
    const particleCount = 50 + Math.floor(intensity * 100);
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a spherical shell around the island
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = radius + Math.random() * radius * 0.5;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.3) * 2; // Mostly above
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    return positions;
  }, [radius, intensity]);

  // Don't render if below minimum threshold
  if (accumulatedMana < MIN_MANA_FOR_AURA || !visible) {
    return null;
  }

  // Aura color - ethereal white-blue
  const auraColor = new THREE.Color().setHSL(0.55, 0.3, 0.85 + intensity * 0.1);

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* Inner glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[radius * 0.8, radius * 1.2, 32]} />
        <meshBasicMaterial
          color={auraColor}
          transparent
          opacity={0.15 + intensity * 0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[radius * 1.1, radius * 1.5, 32]} />
        <meshBasicMaterial
          color={auraColor}
          transparent
          opacity={0.08 + intensity * 0.1}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Floating particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={auraColor}
          size={0.08 + intensity * 0.04}
          transparent
          opacity={0.4 + intensity * 0.4}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* Vertical light beams (appear at higher intensity) */}
      {intensity > 0.3 && (
        <>
          <mesh position={[radius * 0.5, 1, 0]}>
            <cylinderGeometry args={[0.05, 0.1, 3, 8]} />
            <meshBasicMaterial
              color={auraColor}
              transparent
              opacity={0.1 + intensity * 0.15}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[-radius * 0.5, 1, radius * 0.3]}>
            <cylinderGeometry args={[0.04, 0.08, 2.5, 8]} />
            <meshBasicMaterial
              color={auraColor}
              transparent
              opacity={0.08 + intensity * 0.12}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[0, 1, -radius * 0.4]}>
            <cylinderGeometry args={[0.03, 0.06, 2, 8]} />
            <meshBasicMaterial
              color={auraColor}
              transparent
              opacity={0.06 + intensity * 0.1}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
    </group>
  );
};

export default ManaAura;
