"use client";

import React, { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Sky,
  Cloud,
  Environment,
  Float,
  Stars,
  Line,
  Text,
} from "@react-three/drei";
import * as THREE from "three";

// Khaki Color Theme Palette
const THEME = {
  primary: "#C3B091",
  secondary: "#8B7355",
  accent: "#E8DCC4",
  grass: "#A8A060",
  darkGrass: "#8B864E",
  rock: "#6B5D4F",
  darkRock: "#4A3F35",
  tree: "#9B8B6F",
  foliage: "#A3A061",
  house: "#D4C4A8",
  roof: "#8B6F47",
  sky: "#87CEEB",
  fog: "#B0E0E6",
  water: "#A8C5C0",
  waterDark: "#7A9B96",
  crystal: "#D4E6E3",
  gridLine: "#8B864E",
  gridHighlight: "#E8DCC4",
  pathway: "#D4A574", // Yellow dirt color
};

// Game Items Configuration
const ITEMS = {
  stone: {
    id: 1,
    name: "Stone",
    price: 10,
    emoji: "🪨",
    color: "#78909c",
    type: "decoration",
  },
  oakTree: {
    id: 2,
    name: "Oak Tree",
    price: 50,
    emoji: "🌳",
    color: "#66bb6a",
    type: "decoration",
  },
  fountain: {
    id: 3,
    name: "Fountain",
    price: 100,
    emoji: "⛲",
    color: "#4fc3f7",
    type: "decoration",
  },
  pumpkin: {
    id: 4,
    name: "Pumpkin Graveyard",
    price: 75,
    emoji: "🎃",
    color: "#ff9800",
    type: "decoration",
  },
  water: {
    id: 5,
    name: "Water Bucket",
    price: 30,
    emoji: "🪣",
    color: "#2196f3",
    type: "water",
  },
  christmas: {
    id: 6,
    name: "Christmas Tree",
    price: 80,
    emoji: "🎄",
    color: "#4caf50",
    type: "decoration",
  },
  flower: {
    id: 7,
    name: "Flower Garden",
    price: 40,
    emoji: "🌸",
    color: "#e91e63",
    type: "decoration",
  },
  pathway: {
    id: 8,
    name: "Walk Pathway",
    price: 20,
    emoji: "🛤️",
    color: "#D4A574",
    type: "pathway",
  },
  lotus: {
    id: 9,
    name: "Lotus",
    price: 35,
    emoji: "🪷",
    color: "#f48fb1",
    type: "water-decoration",
  },
  vines: {
    id: 10,
    name: "Vines",
    price: 25,
    emoji: "🌿",
    color: "#66bb6a",
    type: "decoration",
  },
  dirtBlock: {
    id: 11,
    name: "Dirt Block",
    price: 15,
    emoji: "🟫",
    color: "#8d6e63",
    type: "block",
  },
  stoneBlock: {
    id: 12,
    name: "Stone Block",
    price: 20,
    emoji: "⬜",
    color: "#9e9e9e",
    type: "block",
  },
};

// Island Level Configuration
const ISLAND_LEVELS = {
  1: { size: 5, price: 0, unlocked: true },
  2: { size: 7, price: 500, unlocked: false },
  3: { size: 9, price: 1000, unlocked: false },
};

// Camera positions for each island
const CAMERA_POSITIONS = {
  default: { position: [0, 15, 20], target: [0, 0, 0] },
  island1: { position: [0, 8, 8], target: [0, 0, 0] },
  island2: { position: [12, 10, 12], target: [12, 0, 0] },
  island3: { position: [-12, 10, 12], target: [-12, 0, 8] },
};

// Pathway directions
const PATHWAY_DIRECTIONS = {
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
};

// Game State Management Component
function GameStateManager({ children }) {
  const [gameState, setGameState] = useState({
    currency: 1000,
    oxygen: 100,
    inventory: Array(8).fill(null),
    selectedSlot: 0,
    islandLevel: 1,
    placedObjects: {},
    unlockedIslands: [true, false, false],
    waterCells: [],
    currentCamera: "default",
    removeMode: false,
    pathwayDirection: PATHWAY_DIRECTIONS.HORIZONTAL, // NEW: Pathway direction
  });

  return children(gameState, setGameState);
}

// Camera Controller Component
function CameraController({ targetPosition, targetLookAt, shouldAnimate }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);

  useFrame(() => {
    if (shouldAnimate && targetPosition && targetLookAt) {
      isAnimating.current = true;
      animationProgress.current += 0.05;

      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }

      camera.position.lerp(
        new THREE.Vector3(
          targetPosition[0],
          targetPosition[1],
          targetPosition[2]
        ),
        0.1
      );

      if (controlsRef.current) {
        const currentTarget = controlsRef.current.target;
        currentTarget.lerp(
          new THREE.Vector3(targetLookAt[0], targetLookAt[1], targetLookAt[2]),
          0.1
        );
      }
    } else {
      animationProgress.current = 0;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableRotate={true}
      enableZoom={true}
      minDistance={5}
      maxDistance={30}
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
      enableDamping={true}
      dampingFactor={0.05}
      rotateSpeed={0.8}
    />
  );
}

// Pathway Component with connection detection
function PathwayObject({
  position,
  direction,
  neighbors,
  onRemove,
  isInRemoveMode,
}) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isInRemoveMode) {
      onRemove();
    }
  };

  const commonProps = {
    onClick: handleClick,
    onPointerEnter: () => isInRemoveMode && setHovered(true),
    onPointerLeave: () => setHovered(false),
  };

  // Check neighbors for connections
  const hasLeft = neighbors.left;
  const hasRight = neighbors.right;
  const hasUp = neighbors.up;
  const hasDown = neighbors.down;

  const isHorizontal = direction === PATHWAY_DIRECTIONS.HORIZONTAL;
  const isVertical = direction === PATHWAY_DIRECTIONS.VERTICAL;

  return (
    <group position={position} {...commonProps}>
      {/* Main pathway tile */}
      <mesh
        position={[0, -0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial
          color={hovered && isInRemoveMode ? "#ff0000" : THEME.pathway}
          roughness={0.9}
          emissive={hovered && isInRemoveMode ? "#ff0000" : "#000000"}
          emissiveIntensity={hovered && isInRemoveMode ? 0.3 : 0}
        />
      </mesh>

      {/* Connection lines based on direction and neighbors */}
      {isHorizontal && (
        <>
          {/* Left extension */}
          {hasLeft && (
            <mesh
              position={[-0.55, -0.01, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[0.2, 1.1]} />
              <meshStandardMaterial
                color={hovered && isInRemoveMode ? "#ff0000" : THEME.pathway}
                roughness={0.9}
              />
            </mesh>
          )}
          {/* Right extension */}
          {hasRight && (
            <mesh
              position={[0.55, -0.01, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[0.2, 1.1]} />
              <meshStandardMaterial
                color={hovered && isInRemoveMode ? "#ff0000" : THEME.pathway}
                roughness={0.9}
              />
            </mesh>
          )}
        </>
      )}

      {isVertical && (
        <>
          {/* Up extension */}
          {hasUp && (
            <mesh
              position={[0, -0.01, -0.55]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[1.1, 0.2]} />
              <meshStandardMaterial
                color={hovered && isInRemoveMode ? "#ff0000" : THEME.pathway}
                roughness={0.9}
              />
            </mesh>
          )}
          {/* Down extension */}
          {hasDown && (
            <mesh
              position={[0, -0.01, 0.55]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[1.1, 0.2]} />
              <meshStandardMaterial
                color={hovered && isInRemoveMode ? "#ff0000" : THEME.pathway}
                roughness={0.9}
              />
            </mesh>
          )}
        </>
      )}

      {/* Direction indicator (subtle) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshStandardMaterial
          color={THEME.darkGrass}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

// Placed Object Component
function PlacedObject({
  itemKey,
  position,
  onRemove,
  isInRemoveMode,
  direction,
  neighbors,
}) {
  const item = ITEMS[itemKey];
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  if (!item) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isInRemoveMode) {
      onRemove();
    }
  };

  const commonProps = {
    onClick: handleClick,
    onPointerEnter: () => isInRemoveMode && setHovered(true),
    onPointerLeave: () => setHovered(false),
  };

  const getMaterial = (baseColor) => (
    <meshStandardMaterial
      color={hovered && isInRemoveMode ? "#ff0000" : baseColor}
      roughness={0.9}
      flatShading
      emissive={hovered && isInRemoveMode ? "#ff0000" : "#000000"}
      emissiveIntensity={hovered && isInRemoveMode ? 0.3 : 0}
    />
  );

  // Special handling for pathway
  if (itemKey === "pathway") {
    return (
      <PathwayObject
        position={position}
        direction={direction}
        neighbors={neighbors}
        onRemove={onRemove}
        isInRemoveMode={isInRemoveMode}
      />
    );
  }

  switch (itemKey) {
    case "oakTree":
      return (
        <group position={position} {...commonProps}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
            {getMaterial(THEME.tree)}
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <coneGeometry args={[0.4, 0.5, 6]} />
            {getMaterial(THEME.foliage)}
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <coneGeometry args={[0.3, 0.4, 6]} />
            {getMaterial(THEME.grass)}
          </mesh>
        </group>
      );

    case "christmas":
      return (
        <group position={position} {...commonProps}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
            {getMaterial("#5d4037")}
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <coneGeometry args={[0.4, 0.5, 6]} />
            {getMaterial("#1b5e20")}
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <coneGeometry args={[0.3, 0.4, 6]} />
            {getMaterial("#2e7d32")}
          </mesh>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 0.3;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * radius,
                  0.7,
                  Math.sin(angle) * radius,
                ]}
              >
                <sphereGeometry args={[0.03]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? "#ff0000" : "#ffd700"}
                  emissive={i % 2 === 0 ? "#ff0000" : "#ffd700"}
                  emissiveIntensity={0.5}
                />
              </mesh>
            );
          })}
        </group>
      );

    case "stone":
      return (
        <mesh ref={meshRef} position={position} castShadow {...commonProps}>
          <dodecahedronGeometry args={[0.2, 0]} />
          {getMaterial(item.color)}
        </mesh>
      );

    case "fountain":
      return (
        <group position={position} {...commonProps}>
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.45, 0.12, 8]} />
            {getMaterial(THEME.secondary)}
          </mesh>
          <mesh position={[0, 0.25, 0]} castShadow>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial
              color={hovered && isInRemoveMode ? "#ff0000" : THEME.crystal}
              emissive={hovered && isInRemoveMode ? "#ff0000" : THEME.water}
              emissiveIntensity={hovered && isInRemoveMode ? 0.5 : 0.4}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.06, 32]} />
            <meshStandardMaterial
              color={THEME.water}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      );

    case "pumpkin":
      return (
        <group position={position} {...commonProps}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <sphereGeometry args={[0.2, 8, 6]} />
            {getMaterial("#ff6f00")}
          </mesh>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.08, 6]} />
            {getMaterial("#2e7d32")}
          </mesh>
          <mesh position={[0, 0.15, 0.21]}>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial
              color="#000000"
              emissive="#ff9800"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      );

    case "flower":
      return (
        <group position={position} {...commonProps}>
          {[...Array(5)].map((_, i) => {
            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.15;
            const colors = [
              "#e91e63",
              "#9c27b0",
              "#f44336",
              "#ff9800",
              "#ffeb3b",
            ];
            return (
              <group
                key={i}
                position={[
                  Math.cos(angle) * radius,
                  0,
                  Math.sin(angle) * radius,
                ]}
              >
                <mesh position={[0, 0.1, 0]} castShadow>
                  <cylinderGeometry args={[0.02, 0.02, 0.15, 4]} />
                  {getMaterial("#2e7d32")}
                </mesh>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <sphereGeometry args={[0.05, 6, 6]} />
                  {getMaterial(colors[i])}
                </mesh>
              </group>
            );
          })}
        </group>
      );

    case "lotus":
      return (
        <group position={position} {...commonProps}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 8]} />
            <meshStandardMaterial color="#2e7d32" side={THREE.DoubleSide} />
          </mesh>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 0.08;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * radius,
                  0.08,
                  Math.sin(angle) * radius,
                ]}
                castShadow
              >
                <sphereGeometry args={[0.04, 6, 6]} />
                {getMaterial("#f48fb1")}
              </mesh>
            );
          })}
        </group>
      );

    case "vines":
      return (
        <group position={position} {...commonProps}>
          {[...Array(4)].map((_, i) => (
            <mesh key={i} position={[0, -i * 0.15, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.02, 0.15, 4]} />
              {getMaterial("#2e7d32")}
            </mesh>
          ))}
          {[...Array(6)].map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const y = Math.random() * 0.4;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * 0.05, -y, Math.sin(angle) * 0.05]}
                castShadow
              >
                <sphereGeometry args={[0.03, 4, 4]} />
                {getMaterial("#66bb6a")}
              </mesh>
            );
          })}
        </group>
      );

    case "dirtBlock":
    case "stoneBlock":
      return (
        <mesh
          ref={meshRef}
          position={position}
          castShadow
          receiveShadow
          {...commonProps}
        >
          <boxGeometry args={[1, 1, 1]} />
          {getMaterial(item.color)}
        </mesh>
      );

    case "water":
      return (
        <mesh
          position={[position[0], position[1] - 0.3, position[2]]}
          receiveShadow
          {...commonProps}
        >
          <cylinderGeometry args={[0.55, 0.55, 0.4, 32]} />
          <meshStandardMaterial
            color={hovered && isInRemoveMode ? "#ff0000" : THEME.water}
            transparent
            opacity={0.7}
            roughness={0.1}
            metalness={0.3}
            emissive={hovered && isInRemoveMode ? "#ff0000" : "#000000"}
            emissiveIntensity={hovered && isInRemoveMode ? 0.3 : 0}
          />
        </mesh>
      );

    default:
      return (
        <mesh ref={meshRef} position={position} castShadow {...commonProps}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          {getMaterial(item.color || "#ffffff")}
        </mesh>
      );
  }
}

// Water Flow Effect
function WaterFlow({ position, onSplash, id }) {
  const waterRef = useRef();
  const [splashed, setSplashed] = useState(false);

  useFrame(() => {
    if (waterRef.current && !splashed) {
      waterRef.current.position.y -= 0.05;

      if (waterRef.current.position.y <= -2.3) {
        setSplashed(true);
        if (onSplash) onSplash();
      }
    }
  });

  if (splashed) {
    return (
      <group position={[position[0], -2.3, position[2]]}>
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 0.5;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
            >
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial
                color={THEME.water}
                transparent
                opacity={0.6}
                emissive={THEME.crystal}
                emissiveIntensity={0.4}
              />
            </mesh>
          );
        })}
      </group>
    );
  }

  return (
    <mesh ref={waterRef} position={position}>
      <cylinderGeometry args={[0.08, 0.06, 0.3, 8]} />
      <meshStandardMaterial
        color={THEME.water}
        transparent
        opacity={0.8}
        emissive={THEME.crystal}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// Direction Selector Component - NEW
function DirectionSelector({ onSelectDirection, currentDirection }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(0, 0, 0, 0.9)",
        padding: "30px",
        borderRadius: "20px",
        backdropFilter: "blur(20px)",
        border: "3px solid #E8DCC4",
        boxShadow: "0 10px 50px rgba(0, 0, 0, 0.8)",
        zIndex: 1000,
        pointerEvents: "auto",
      }}
    >
      <h3
        style={{ color: "#E8DCC4", marginBottom: "20px", textAlign: "center" }}
      >
        🛤️ Choose Pathway Direction
      </h3>
      <div style={{ display: "flex", gap: "20px" }}>
        <button
          onClick={() => onSelectDirection(PATHWAY_DIRECTIONS.HORIZONTAL)}
          style={{
            padding: "20px 40px",
            background:
              currentDirection === PATHWAY_DIRECTIONS.HORIZONTAL
                ? "linear-gradient(135deg, #4caf50, #66bb6a)"
                : "linear-gradient(135deg, #667eea, #764ba2)",
            border:
              currentDirection === PATHWAY_DIRECTIONS.HORIZONTAL
                ? "3px solid #ffffff"
                : "none",
            borderRadius: "15px",
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "40px" }}>↔️</span>
          <span>Horizontal</span>
        </button>
        <button
          onClick={() => onSelectDirection(PATHWAY_DIRECTIONS.VERTICAL)}
          style={{
            padding: "20px 40px",
            background:
              currentDirection === PATHWAY_DIRECTIONS.VERTICAL
                ? "linear-gradient(135deg, #4caf50, #66bb6a)"
                : "linear-gradient(135deg, #667eea, #764ba2)",
            border:
              currentDirection === PATHWAY_DIRECTIONS.VERTICAL
                ? "3px solid #ffffff"
                : "none",
            borderRadius: "15px",
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "40px" }}>↕️</span>
          <span>Vertical</span>
        </button>
      </div>
    </div>
  );
}

// Inventory Bar Component
function InventoryBar({
  inventory,
  selectedSlot,
  onSelectSlot,
  currency,
  oxygen,
  removeMode,
  onToggleRemoveMode,
  showDirectionSelector,
  onToggleDirectionSelector,
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        background: "rgba(0, 0, 0, 0.7)",
        padding: "15px",
        borderRadius: "15px",
        backdropFilter: "blur(10px)",
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      {/* Shovel Button */}
      <div
        onClick={onToggleRemoveMode}
        style={{
          width: "60px",
          height: "60px",
          background: removeMode
            ? "linear-gradient(135deg, #e53935, #c62828)"
            : "linear-gradient(135deg, #757575, #616161)",
          border: removeMode
            ? "3px solid #ff5252"
            : "2px solid rgba(255, 255, 255, 0.3)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          cursor: "pointer",
          transition: "all 0.3s",
          boxShadow: removeMode ? "0 0 20px rgba(229, 57, 53, 0.7)" : "none",
          position: "relative",
        }}
      >
        🪓
        {removeMode && (
          <div
            style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              background: "#ff5252",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              border: "2px solid white",
              fontWeight: "bold",
            }}
          >
            ON
          </div>
        )}
      </div>

      {/* Inventory Slots */}
      {inventory.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            if (!removeMode) {
              onSelectSlot(index);
              // Show direction selector if pathway is selected
              if (item === "pathway") {
                onToggleDirectionSelector(true);
              }
            }
          }}
          style={{
            width: "60px",
            height: "60px",
            background:
              selectedSlot === index && !removeMode
                ? "linear-gradient(135deg, #8B7355, #C3B091)"
                : "rgba(255, 255, 255, 0.1)",
            border:
              selectedSlot === index && !removeMode
                ? "3px solid #E8DCC4"
                : "2px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            cursor: removeMode ? "not-allowed" : "pointer",
            transition: "all 0.3s",
            boxShadow:
              selectedSlot === index && !removeMode
                ? "0 0 15px rgba(232, 220, 196, 0.5)"
                : "none",
            position: "relative",
            opacity: removeMode ? 0.5 : 1,
          }}
        >
          {item && ITEMS[item]?.emoji}
          {selectedSlot === index && !removeMode && item && (
            <div
              style={{
                position: "absolute",
                bottom: "-8px",
                right: "-8px",
                background: "#4caf50",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                border: "2px solid white",
              }}
            >
              ✓
            </div>
          )}
        </div>
      ))}

      <div
        style={{
          marginLeft: "15px",
          padding: "12px 20px",
          background: "linear-gradient(135deg, #ffd700, #ffed4e)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#333",
          boxShadow: "0 4px 12px rgba(255, 215, 0, 0.4)",
        }}
      >
        💰 {currency}
      </div>

      <div
        style={{
          padding: "12px 20px",
          background: `linear-gradient(135deg, #4fc3f7, #03a9f4)`,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "18px",
          fontWeight: "bold",
          color: "white",
          boxShadow: "0 4px 12px rgba(79, 195, 247, 0.4)",
        }}
      >
        💨 {oxygen}%
      </div>
    </div>
  );
}

// Shop Component
function Shop({ isOpen, onClose, onPurchase, currency }) {
  const [notification, setNotification] = useState("");

  const handlePurchase = (itemKey) => {
    const item = ITEMS[itemKey];
    if (currency >= item.price) {
      onPurchase(itemKey, item.price);
      setNotification(`✅ Successfully purchased ${item.name}!`);
      setTimeout(() => setNotification(""), 2000);
    } else {
      setNotification(
        `❌ Not enough currency! Need ${item.price - currency} more.`
      );
      setTimeout(() => setNotification(""), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(0, 0, 0, 0.95)",
        padding: "30px",
        borderRadius: "20px",
        backdropFilter: "blur(20px)",
        border: "3px solid #E8DCC4",
        boxShadow: "0 10px 50px rgba(0, 0, 0, 0.8)",
        zIndex: 1000,
        maxWidth: "800px",
        maxHeight: "600px",
        overflow: "auto",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <h2 style={{ color: "#E8DCC4", fontSize: "28px", margin: 0 }}>
          🏪 Island Shop
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "#c62828",
            border: "none",
            color: "white",
            padding: "10px 20px",
            borderRadius: "10px",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ✕ Close
        </button>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #ffd700, #ffed4e)",
          padding: "15px",
          borderRadius: "12px",
          marginBottom: "20px",
          textAlign: "center",
          fontSize: "20px",
          fontWeight: "bold",
          color: "#333",
        }}
      >
        Your Balance: 💰 {currency}
      </div>

      {notification && (
        <div
          style={{
            background: notification.includes("✅") ? "#4caf50" : "#f44336",
            color: "white",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "15px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {notification}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "15px",
        }}
      >
        {Object.entries(ITEMS).map(([key, item]) => (
          <div
            key={item.id}
            onClick={() => handlePurchase(key)}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid rgba(232, 220, 196, 0.3)",
              borderRadius: "12px",
              padding: "15px",
              cursor: "pointer",
              transition: "all 0.3s",
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(232, 220, 196, 0.2)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>
              {item.emoji}
            </div>
            <div
              style={{
                color: "#E8DCC4",
                fontWeight: "bold",
                marginBottom: "5px",
              }}
            >
              {item.name}
            </div>
            <div
              style={{ color: "#ffd700", fontSize: "18px", fontWeight: "bold" }}
            >
              💰 {item.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Shop Button
function ShopButton({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        bottom: "100px",
        right: "30px",
        width: "80px",
        height: "80px",
        background: "linear-gradient(135deg, #ffd700, #ffed4e)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "40px",
        cursor: "pointer",
        boxShadow: "0 6px 20px rgba(255, 215, 0, 0.5)",
        border: "4px solid white",
        transition: "all 0.3s",
        zIndex: 100,
        pointerEvents: "auto",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      🏪
    </div>
  );
}

// Camera Control Buttons
function CameraButtons({ onCameraChange, currentCamera }) {
  const buttons = [
    { id: "default", emoji: "🏝️", label: "All Islands" },
    { id: "island1", emoji: "1️⃣", label: "Island 1" },
    { id: "island2", emoji: "2️⃣", label: "Island 2" },
    { id: "island3", emoji: "3️⃣", label: "Island 3" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={() => onCameraChange(btn.id)}
          style={{
            padding: "12px 20px",
            background:
              currentCamera === btn.id
                ? "linear-gradient(135deg, #4caf50, #66bb6a)"
                : "linear-gradient(135deg, #667eea, #764ba2)",
            border: currentCamera === btn.id ? "3px solid #ffffff" : "none",
            borderRadius: "12px",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <span style={{ fontSize: "24px" }}>{btn.emoji}</span>
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// Success Message
function SuccessMessage({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "100px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg, #4caf50, #66bb6a)",
        color: "white",
        padding: "20px 40px",
        borderRadius: "15px",
        fontSize: "20px",
        fontWeight: "bold",
        boxShadow: "0 8px 24px rgba(76, 175, 80, 0.5)",
        zIndex: 1000,
        border: "3px solid white",
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}

// Grid Platform
function GridPlatform({
  gridSize = 5,
  islandLevel,
  onCellClick,
  placedObjects,
  waterCells,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const cellSize = 1.2;
  const totalSize = gridSize * cellSize;
  const offset = totalSize / 2 - cellSize / 2;

  const isInnerArea = (row, col) => {
    const center = Math.floor(gridSize / 2);
    const distance = Math.max(Math.abs(row - center), Math.abs(col - center));
    return distance <= Math.floor(gridSize / 3);
  };

  return (
    <group position={[0, 0.02, 0]}>
      {[...Array(gridSize + 1)].map((_, i) => {
        const z = i * cellSize - offset - cellSize / 2;
        const points = [
          new THREE.Vector3(-offset - cellSize / 2, 0, z),
          new THREE.Vector3(offset + cellSize / 2, 0, z),
        ];

        return (
          <Line
            key={`h-${i}`}
            points={points}
            color={THEME.gridLine}
            lineWidth={2}
          />
        );
      })}

      {[...Array(gridSize + 1)].map((_, i) => {
        const x = i * cellSize - offset - cellSize / 2;
        const points = [
          new THREE.Vector3(x, 0, -offset - cellSize / 2),
          new THREE.Vector3(x, 0, offset + cellSize / 2),
        ];

        return (
          <Line
            key={`v-${i}`}
            points={points}
            color={THEME.gridLine}
            lineWidth={2}
          />
        );
      })}

      {[...Array(gridSize)].map((_, row) =>
        [...Array(gridSize)].map((_, col) => {
          const x = col * cellSize - offset;
          const z = row * cellSize - offset;
          const cellId = `${row}-${col}`;
          const isHovered = hoveredCell === cellId;
          const isInner = isInnerArea(row, col);
          const hasWater = waterCells.includes(cellId);

          return (
            <mesh
              key={cellId}
              position={[x, 0, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerEnter={() => setHoveredCell(cellId)}
              onPointerLeave={() => setHoveredCell(null)}
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(x, z, isInner, cellId);
              }}
            >
              <planeGeometry args={[cellSize * 0.95, cellSize * 0.95]} />
              <meshStandardMaterial
                color={
                  hasWater
                    ? THEME.water
                    : isHovered
                    ? THEME.gridHighlight
                    : isInner
                    ? THEME.grass
                    : THEME.darkGrass
                }
                transparent
                opacity={hasWater ? 0.8 : isHovered ? 0.9 : 0.6}
                emissive={
                  isHovered
                    ? THEME.accent
                    : hasWater
                    ? THEME.crystal
                    : THEME.grass
                }
                emissiveIntensity={isHovered ? 0.4 : hasWater ? 0.2 : 0.1}
              />
            </mesh>
          );
        })
      )}

      <Text
        position={[0, 0.5, offset + cellSize]}
        fontSize={0.3}
        color={THEME.accent}
        anchorX="center"
        anchorY="middle"
      >
        Level {islandLevel} - {gridSize}x{gridSize}
      </Text>
    </group>
  );
}

// Island Base
function IslandBase({ gridSize = 5 }) {
  const radius = (gridSize * 1.2) / 2 + 0.5;

  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(radius, 5, 6, 1);

    const positionAttribute = geo.getAttribute("position");
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      if (y < 0) {
        positionAttribute.setXYZ(
          i,
          x + (Math.random() - 0.5) * 0.3,
          y + (Math.random() - 0.5) * 0.2,
          z + (Math.random() - 0.5) * 0.3
        );
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [gridSize]);

  return (
    <>
      <mesh
        geometry={geometry}
        position={[0, -2.5, 0]}
        rotation={[Math.PI, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={THEME.darkRock}
          roughness={0.95}
          metalness={0.05}
          flatShading
        />
      </mesh>

      <mesh
        position={[0, -2.3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[radius * 2, radius * 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

// Grass Base
function GrassBase({ gridSize = 5 }) {
  const radius = (gridSize * 1.2) / 2 + 0.5;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[radius, 32]} />
      <meshStandardMaterial
        color={THEME.darkGrass}
        roughness={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Clickable Island Component
function ClickableIsland({
  position,
  islandId,
  onIslandClick,
  isLocked,
  level,
}) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onIslandClick(islandId);
      }}
      onPointerEnter={(e) => {
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={(e) => {
        document.body.style.cursor = "default";
      }}
    >
      <IslandBase gridSize={5} />
      <GrassBase gridSize={5} />
      <GridPlatform
        gridSize={5}
        islandLevel={1}
        onCellClick={() => {}}
        placedObjects={{}}
        waterCells={[]}
      />

      {isLocked && (
        <>
          <Text
            position={[0, 2, 0]}
            fontSize={0.8}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            🔒
          </Text>

          <Text
            position={[0, 1, 0]}
            fontSize={0.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
          >
            Locked - Level {level}
          </Text>

          <Text
            position={[0, 0.3, 0]}
            fontSize={0.35}
            color="#ffeb3b"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {level === 2 ? "💰 500 coins to unlock" : "💰 1000 coins to unlock"}
          </Text>
        </>
      )}
    </group>
  );
}

// Helper function to get pathway neighbors
function getPathwayNeighbors(x, z, placedObjects) {
  const cellSize = 1.2;
  const neighbors = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  // Check left
  const leftKey = `${(x - cellSize).toFixed(1)},0,${z.toFixed(1)}`;
  if (placedObjects[leftKey]?.item === "pathway") {
    neighbors.left = true;
  }

  // Check right
  const rightKey = `${(x + cellSize).toFixed(1)},0,${z.toFixed(1)}`;
  if (placedObjects[rightKey]?.item === "pathway") {
    neighbors.right = true;
  }

  // Check up
  const upKey = `${x.toFixed(1)},0,${(z - cellSize).toFixed(1)}`;
  if (placedObjects[upKey]?.item === "pathway") {
    neighbors.up = true;
  }

  // Check down
  const downKey = `${x.toFixed(1)},0,${(z + cellSize).toFixed(1)}`;
  if (placedObjects[downKey]?.item === "pathway") {
    neighbors.down = true;
  }

  return neighbors;
}

// Main Island Scene
function IslandScene({
  islandLevel,
  unlockedIslands,
  onCellClick,
  placedObjects,
  waterCells,
  waterFlows,
  onIslandClick,
  onRemoveObject,
  removeMode,
}) {
  const groupRef = useRef();
  const gridSize = ISLAND_LEVELS[islandLevel].size;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    }
  });

  return (
    <>
      {/* Main Island 1 */}
      <group ref={groupRef} position={[0, 0, 0]}>
        <IslandBase gridSize={gridSize} />
        <GrassBase gridSize={gridSize} />
        <GridPlatform
          gridSize={gridSize}
          islandLevel={islandLevel}
          onCellClick={onCellClick}
          placedObjects={placedObjects}
          waterCells={waterCells}
        />

        {Object.entries(placedObjects).map(([posKey, data]) => {
          const [x, y, z] = posKey.split(",").map(Number);
          const neighbors =
            data.item === "pathway"
              ? getPathwayNeighbors(x, z, placedObjects)
              : {};

          return (
            <PlacedObject
              key={posKey}
              itemKey={data.item}
              position={[x, y + (data.height || 0), z]}
              onRemove={() => onRemoveObject(posKey)}
              isInRemoveMode={removeMode}
              direction={data.direction || PATHWAY_DIRECTIONS.HORIZONTAL}
              neighbors={neighbors}
            />
          );
        })}

        {waterFlows.map((flow) => (
          <WaterFlow
            key={flow.id}
            id={flow.id}
            position={flow.position}
            onSplash={flow.onSplash}
          />
        ))}
      </group>

      {/* Island 2 */}
      <ClickableIsland
        position={[12, 0, 0]}
        islandId="island2"
        onIslandClick={onIslandClick}
        isLocked={!unlockedIslands[1]}
        level={2}
      />

      {/* Island 3 */}
      <ClickableIsland
        position={[-12, 0, 8]}
        islandId="island3"
        onIslandClick={onIslandClick}
        isLocked={!unlockedIslands[2]}
        level={3}
      />
    </>
  );
}

// Main Component
export default function FloatingIsland() {
  const [shopOpen, setShopOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [waterFlows, setWaterFlows] = useState([]);
  const [cameraTarget, setCameraTarget] = useState(CAMERA_POSITIONS.default);
  const [shouldAnimateCamera, setShouldAnimateCamera] = useState(false);
  const [showDirectionSelector, setShowDirectionSelector] = useState(false);

  return (
    <GameStateManager>
      {(gameState, setGameState) => {
        const handlePurchase = (itemKey, price) => {
          const emptySlot = gameState.inventory.findIndex(
            (slot) => slot === null
          );
          if (emptySlot !== -1 && gameState.currency >= price) {
            const newInventory = [...gameState.inventory];
            newInventory[emptySlot] = itemKey;
            setGameState({
              ...gameState,
              currency: gameState.currency - price,
              inventory: newInventory,
            });
          }
        };

        // FIXED: Remove object handler - now handles water removal properly
        const handleRemoveObject = (posKey) => {
          const removedObject = gameState.placedObjects[posKey];
          if (!removedObject) return;

          const item = ITEMS[removedObject.item];
          const [x, y, z] = posKey.split(",").map(Number);
          const refundAmount = item.price;
          const isBlock = item.type === "block";

          let objectsToRemove = [posKey];

          if (isBlock) {
            let currentY = y + 1;
            while (true) {
              const upperKey = `${x.toFixed(1)},${currentY.toFixed(
                1
              )},${z.toFixed(1)}`;
              if (gameState.placedObjects[upperKey]) {
                objectsToRemove.push(upperKey);
                currentY++;
              } else {
                break;
              }
            }
          }

          const newPlacedObjects = { ...gameState.placedObjects };
          let totalRefund = 0;

          objectsToRemove.forEach((key) => {
            const obj = newPlacedObjects[key];
            if (obj) {
              totalRefund += ITEMS[obj.item].price;
              delete newPlacedObjects[key];
            }
          });

          // FIXED: Properly remove water cells
          const cellSize = 1.2;
          const gridSize = ISLAND_LEVELS[gameState.islandLevel].size;
          const offset = (gridSize * cellSize) / 2 - cellSize / 2;

          const col = Math.round((x + offset) / cellSize);
          const row = Math.round((z + offset) / cellSize);
          const cellId = `${row}-${col}`;

          const newWaterCells = gameState.waterCells.filter(
            (id) => id !== cellId
          );

          setGameState({
            ...gameState,
            placedObjects: newPlacedObjects,
            waterCells: newWaterCells,
            currency: gameState.currency + totalRefund,
          });

          const removedCount = objectsToRemove.length;
          setSuccessMessage(
            removedCount > 1
              ? `🗑️ Removed ${removedCount} objects! +💰${totalRefund}`
              : `🗑️ Object removed! +💰${totalRefund}`
          );
          setTimeout(() => setSuccessMessage(""), 2000);
        };

        const handleCellClick = (x, z, isInner, cellId) => {
          if (gameState.removeMode) return;

          const selectedItem = gameState.inventory[gameState.selectedSlot];
          if (!selectedItem) {
            setSuccessMessage("❌ No item selected!");
            setTimeout(() => setSuccessMessage(""), 2000);
            return;
          }

          const item = ITEMS[selectedItem];
          let height = 0;

          if (item.type === "block") {
            let currentHeight = 0;
            while (true) {
              const checkKey = `${x.toFixed(1)},${currentHeight.toFixed(
                1
              )},${z.toFixed(1)}`;
              if (gameState.placedObjects[checkKey]) {
                currentHeight++;
              } else {
                break;
              }
            }
            height = currentHeight;
          }

          const posKey = `${x.toFixed(1)},${height.toFixed(1)},${z.toFixed(1)}`;

          if (selectedItem === "water") {
            if (isInner) {
              if (!gameState.waterCells.includes(cellId)) {
                const newWaterCells = [...gameState.waterCells, cellId];
                const newInventory = [...gameState.inventory];
                newInventory[gameState.selectedSlot] = null;

                setGameState({
                  ...gameState,
                  waterCells: newWaterCells,
                  inventory: newInventory,
                  placedObjects: {
                    ...gameState.placedObjects,
                    [posKey]: { item: "water", height: 0 },
                  },
                });
                setSuccessMessage("✅ Pond created!");
                setTimeout(() => setSuccessMessage(""), 2000);
              }
            } else {
              const flowId = Date.now();
              const newFlow = {
                id: flowId,
                position: [x, 0, z],
                onSplash: () => {
                  setSuccessMessage("💦 Water splashed!");
                  setTimeout(() => setSuccessMessage(""), 2000);
                },
              };

              setWaterFlows([...waterFlows, newFlow]);
              setSuccessMessage("💧 Water flowing down...");

              setTimeout(() => {
                setWaterFlows((flows) => flows.filter((f) => f.id !== flowId));
              }, 3000);
            }
            return;
          }

          if (height === 0 && gameState.placedObjects[posKey]) {
            setSuccessMessage("❌ Cell occupied!");
            setTimeout(() => setSuccessMessage(""), 2000);
            return;
          }

          const newPlacedObjects = {
            ...gameState.placedObjects,
            [posKey]: {
              item: selectedItem,
              height: height,
              direction:
                item.type === "pathway"
                  ? gameState.pathwayDirection
                  : undefined,
            },
          };

          const newInventory = [...gameState.inventory];
          newInventory[gameState.selectedSlot] = null;

          setGameState({
            ...gameState,
            placedObjects: newPlacedObjects,
            inventory: newInventory,
          });

          setSuccessMessage(`✅ ${item.name} placed successfully!`);
          setTimeout(() => setSuccessMessage(""), 2000);
        };

        const handleCameraChange = (cameraId) => {
          setCameraTarget(CAMERA_POSITIONS[cameraId]);
          setShouldAnimateCamera(true);
          setGameState({ ...gameState, currentCamera: cameraId });

          setTimeout(() => {
            setShouldAnimateCamera(false);
          }, 2000);
        };

        const handleIslandClick = (islandId) => {
          const islandIndex = islandId === "island2" ? 1 : 2;
          const isLocked = !gameState.unlockedIslands[islandIndex];

          if (isLocked) {
            const unlockCost = islandIndex === 1 ? 500 : 1000;

            if (gameState.currency >= unlockCost) {
              const newUnlockedIslands = [...gameState.unlockedIslands];
              newUnlockedIslands[islandIndex] = true;

              const newState = {
                ...gameState,
                currency: gameState.currency - unlockCost,
                unlockedIslands: newUnlockedIslands,
              };

              setGameState(newState);
              handleCameraChange(islandId);

              setSuccessMessage(
                `🎉 ${
                  islandId === "island2" ? "Island 2" : "Island 3"
                } unlocked!`
              );
              setTimeout(() => setSuccessMessage(""), 3000);
            } else {
              setSuccessMessage(
                `❌ Need ${
                  unlockCost - gameState.currency
                } more coins to unlock!`
              );
              setTimeout(() => setSuccessMessage(""), 2000);
            }
          } else {
            handleCameraChange(islandId);
            setSuccessMessage(
              `📍 Moved to ${islandId === "island2" ? "Island 2" : "Island 3"}!`
            );
            setTimeout(() => setSuccessMessage(""), 2000);
          }
        };

        const handleToggleRemoveMode = () => {
          setGameState({
            ...gameState,
            removeMode: !gameState.removeMode,
          });

          setSuccessMessage(
            !gameState.removeMode
              ? "🪓 Remove mode ON - Click items to remove"
              : "✅ Remove mode OFF"
          );
          setTimeout(() => setSuccessMessage(""), 2000);
        };

        const handleDirectionChange = (direction) => {
          setGameState({
            ...gameState,
            pathwayDirection: direction,
          });
          setShowDirectionSelector(false);
          setSuccessMessage(
            `🛤️ Pathway direction: ${
              direction === PATHWAY_DIRECTIONS.HORIZONTAL
                ? "↔️ Horizontal"
                : "↕️ Vertical"
            }`
          );
          setTimeout(() => setSuccessMessage(""), 2000);
        };

        return (
          <div
            style={{
              width: "100vw",
              height: "100vh",
              background: THEME.sky,
              pointerEvents: "none",
            }}
          >
            <Canvas
              shadows
              camera={{ position: CAMERA_POSITIONS.default.position, fov: 50 }}
              style={{ pointerEvents: "auto" }}
            >
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

              <mesh>
                <sphereGeometry args={[100, 32, 32]} />
                <meshBasicMaterial
                  color="#87CEEB"
                  side={THREE.BackSide}
                  fog={false}
                />
              </mesh>

              <IslandScene
                islandLevel={gameState.islandLevel}
                unlockedIslands={gameState.unlockedIslands}
                onCellClick={handleCellClick}
                placedObjects={gameState.placedObjects}
                waterCells={gameState.waterCells}
                waterFlows={waterFlows}
                onIslandClick={handleIslandClick}
                onRemoveObject={handleRemoveObject}
                removeMode={gameState.removeMode}
              />

              <CameraController
                targetPosition={cameraTarget.position}
                targetLookAt={cameraTarget.target}
                shouldAnimate={shouldAnimateCamera}
              />

              <fog attach="fog" args={[THEME.fog, 15, 50]} />
            </Canvas>

            <InventoryBar
              inventory={gameState.inventory}
              selectedSlot={gameState.selectedSlot}
              onSelectSlot={(slot) =>
                setGameState({ ...gameState, selectedSlot: slot })
              }
              currency={gameState.currency}
              oxygen={gameState.oxygen}
              removeMode={gameState.removeMode}
              onToggleRemoveMode={handleToggleRemoveMode}
              showDirectionSelector={showDirectionSelector}
              onToggleDirectionSelector={setShowDirectionSelector}
            />

            <ShopButton onClick={() => setShopOpen(true)} />

            <CameraButtons
              onCameraChange={handleCameraChange}
              currentCamera={gameState.currentCamera}
            />

            <Shop
              isOpen={shopOpen}
              onClose={() => setShopOpen(false)}
              onPurchase={handlePurchase}
              currency={gameState.currency}
            />

            {showDirectionSelector && (
              <DirectionSelector
                onSelectDirection={handleDirectionChange}
                currentDirection={gameState.pathwayDirection}
              />
            )}

            <SuccessMessage message={successMessage} />

            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "rgba(0, 0, 0, 0.7)",
                padding: "15px 25px",
                borderRadius: "15px",
                color: "#E8DCC4",
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0" }}>🏝️ Island Builder</h3>
              <p style={{ margin: "5px 0" }}>Level: {gameState.islandLevel}</p>
              <p style={{ margin: "5px 0" }}>
                Grid: {ISLAND_LEVELS[gameState.islandLevel].size}x
                {ISLAND_LEVELS[gameState.islandLevel].size}
              </p>
              <p style={{ margin: "5px 0", fontSize: "12px", opacity: 0.8 }}>
                {gameState.removeMode
                  ? "🪓 Remove Mode - Click items to remove"
                  : gameState.inventory[gameState.selectedSlot]
                  ? `Selected: ${
                      ITEMS[gameState.inventory[gameState.selectedSlot]].name
                    }`
                  : "No item selected"}
              </p>
              {gameState.inventory[gameState.selectedSlot] === "pathway" &&
                !gameState.removeMode && (
                  <p
                    style={{
                      margin: "5px 0",
                      fontSize: "12px",
                      color: "#ffeb3b",
                    }}
                  >
                    🛤️ Direction:{" "}
                    {gameState.pathwayDirection ===
                    PATHWAY_DIRECTIONS.HORIZONTAL
                      ? "↔️ Horizontal"
                      : "↕️ Vertical"}
                  </p>
                )}
            </div>
          </div>
        );
      }}
    </GameStateManager>
  );
}
