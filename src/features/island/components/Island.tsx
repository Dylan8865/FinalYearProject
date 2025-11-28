"use client";

import React, { useMemo, useRef, useState, useEffect, JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";

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
  pathway: "#D4A574",
};

interface IslandBaseProps {
  gridSize?: number;
}

const IslandBase = ({ gridSize = 5 }: IslandBaseProps) => {
  const radius = (gridSize * 1.2) / 2;
  const height = 4;
  const [randomValues, setRandomValues] = useState<
    Array<{ x: number; y: number; z: number }>
  >([]);

  const vertexCount = useMemo(() => {
    const geo = new THREE.ConeGeometry(radius, height, 8, 4, false);
    const count = geo.getAttribute("position").count;
    geo.dispose();
    return count;
  }, [radius, height]);

  useEffect(() => {
    const newRandomValues: Array<{ x: number; y: number; z: number }> = [];
    (async () => {
      for (let i = 0; i < vertexCount; i++) {
        newRandomValues.push({
          x: (Math.random() - 0.5) * 0.6,
          y: (Math.random() - 0.5) * 0.4,
          z: (Math.random() - 0.5) * 0.6,
        });
      }
      await setRandomValues(newRandomValues);
    })();
  }, [vertexCount]);

  const geometry = useMemo(() => {
    if (randomValues.length === 0) return null;

    const geo = new THREE.ConeGeometry(radius, height, 8, 4, false);
    const positionAttribute = geo.getAttribute("position");

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      const heightFactor = (y + height / 2) / height;
      const deformAmount = 1 - heightFactor * 0.7;

      if (randomValues[i]) {
        positionAttribute.setXYZ(
          i,
          x + randomValues[i].x * deformAmount,
          y + randomValues[i].y * deformAmount * 0.5,
          z + randomValues[i].z * deformAmount
        );
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [radius, height, randomValues]);

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry}
      position={[0, -height / 2, 0]}
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
  );
};

interface GrassBaseProps {
  gridSize?: number;
}

const GrassBase = ({ gridSize = 5 }: GrassBaseProps) => {
  const radius = (gridSize * 1.2) / 2;
  const [randomValues, setRandomValues] = useState<
    Array<{ offset: number; angle: number }>
  >([]);

  useEffect(() => {
    const vertices = 32;
    const newRandomValues = [];
    (async () => {
      for (let i = 0; i < vertices; i++) {
        newRandomValues.push({
          offset: 0.85 + Math.random() * 0.25,
          angle: (i / vertices) * Math.PI * 2,
        });
      }
      await setRandomValues(newRandomValues);
    })();
  }, []);

  const shape = useMemo(() => {
    if (randomValues.length === 0) return null;

    const shape = new THREE.Shape();

    randomValues.forEach((point, i) => {
      const r = radius * point.offset;
      const x = Math.cos(point.angle) * r;
      const y = Math.sin(point.angle) * r;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    });

    shape.closePath();
    return shape;
  }, [radius, randomValues]);

  if (!shape) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        color={THEME.darkGrass}
        roughness={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

interface GridPlatformProps {
  gridSize?: number;
  islandLevel: number;
  onCellClick: (x: number, z: number, isInner: boolean, cellId: string) => void;
  placedObjects: Record<string, React.ReactNode>;
  waterCells: string[];
}

const GridPlatform = ({
  gridSize = 5,
  islandLevel,
  onCellClick,
  placedObjects,
  waterCells,
}: GridPlatformProps) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const cellSize = 1.2;
  const totalSize = gridSize * cellSize;
  const offset = totalSize / 2 - cellSize / 2;
  const islandRadius = (gridSize * 1.2) / 2;
  const center = Math.floor(gridSize / 2);

  const isInnerArea = (row: number, col: number) => {
    const distance = Math.max(Math.abs(row - center), Math.abs(col - center));
    return distance <= Math.floor(gridSize / 3);
  };

  // Check if a cell should be rendered (circular pattern)
  const shouldRenderCell = (row: number, col: number) => {
    const dx = col - center;
    const dz = row - center;
    const distFromCenter = Math.sqrt(dx * dx + dz * dz);

    // Create circular boundary with slight randomness for natural look
    const maxRadius = gridSize / 2;
    const randomOffset = Math.sin(row * 2.5) * Math.cos(col * 2.5) * 0.3;

    return distFromCenter <= maxRadius + randomOffset;
  };

  // Get actual world position from grid coordinates
  const getCellPosition = (row: number, col: number): [number, number] => {
    const x = col * cellSize - offset;
    const z = row * cellSize - offset;
    return [x, z];
  };

  // Check if a cell exists at given grid coordinates
  const cellExists = (row: number, col: number) => {
    return (
      row >= 0 &&
      row < gridSize &&
      col >= 0 &&
      col < gridSize &&
      shouldRenderCell(row, col)
    );
  };

  // Generate grid lines only between existing cells
  const generateGridLines = () => {
    const horizontalLines: JSX.Element[] = [];
    const verticalLines: JSX.Element[] = [];

    // Horizontal lines
    for (let row = 0; row <= gridSize; row++) {
      const lineSegments: THREE.Vector3[][] = [];
      let currentSegment: THREE.Vector3[] = [];

      for (let col = 0; col <= gridSize; col++) {
        const [x, z] = getCellPosition(row - 0.5, col - 0.5);
        const hasTopCell = cellExists(row - 1, col - 1);
        const hasBottomCell = cellExists(row, col - 1);

        if (hasTopCell || hasBottomCell) {
          currentSegment.push(new THREE.Vector3(x, 0, z));
        } else {
          if (currentSegment.length >= 2) {
            lineSegments.push([...currentSegment]);
          }
          currentSegment = [];
        }
      }

      if (currentSegment.length >= 2) {
        lineSegments.push(currentSegment);
      }

      lineSegments.forEach((segment, idx) => {
        horizontalLines.push(
          <Line
            key={`h-${row}-${idx}`}
            points={segment}
            color={THEME.gridLine}
            lineWidth={2}
          />
        );
      });
    }

    // Vertical lines
    for (let col = 0; col <= gridSize; col++) {
      const lineSegments: THREE.Vector3[][] = [];
      let currentSegment: THREE.Vector3[] = [];

      for (let row = 0; row <= gridSize; row++) {
        const [x, z] = getCellPosition(row - 0.5, col - 0.5);
        const hasLeftCell = cellExists(row - 1, col - 1);
        const hasRightCell = cellExists(row - 1, col);

        if (hasLeftCell || hasRightCell) {
          currentSegment.push(new THREE.Vector3(x, 0, z));
        } else {
          if (currentSegment.length >= 2) {
            lineSegments.push([...currentSegment]);
          }
          currentSegment = [];
        }
      }

      if (currentSegment.length >= 2) {
        lineSegments.push(currentSegment);
      }

      lineSegments.forEach((segment, idx) => {
        verticalLines.push(
          <Line
            key={`v-${col}-${idx}`}
            points={segment}
            color={THEME.gridLine}
            lineWidth={2}
          />
        );
      });
    }

    return [...horizontalLines, ...verticalLines];
  };

  return (
    <group position={[0, 0.02, 0]}>
      {/* Grid lines */}
      {generateGridLines()}

      {/* Grid cells */}
      {[...Array(gridSize)].map((_, row) =>
        [...Array(gridSize)].map((_, col) => {
          if (!shouldRenderCell(row, col)) return null;

          const [x, z] = getCellPosition(row, col);
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
    </group>
  );
};

interface IslandProps {
  gridSize?: number;
  position?: [number, number, number];
  animate?: boolean;
}

const Island = ({
  gridSize = 5,
  position = [0, 0, 0],
  animate = true,
}: IslandProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && animate) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <IslandBase gridSize={gridSize} />
      <GrassBase gridSize={gridSize} />
      <GridPlatform
        gridSize={gridSize}
        islandLevel={1}
        onCellClick={() => {}}
        placedObjects={{}}
        waterCells={[]}
      />
    </group>
  );
};

export default Island;
