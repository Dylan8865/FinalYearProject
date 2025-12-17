import { useMemo } from "react";
import * as THREE from "three";

/**
 * Helper function to create a brick/cobblestone pattern
 */
function createBrickTexture(
  baseColor: string,
  mortarColor: string = "#888888"
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Fill base
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Draw brick pattern
  const brickWidth = size / 4;
  const brickHeight = size / 8;
  const mortarWidth = 4;

  ctx.fillStyle = mortarColor;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      const offsetX = row % 2 === 0 ? 0 : brickWidth / 2;
      const x = col * brickWidth + offsetX;
      const y = row * brickHeight;

      // Draw mortar lines
      ctx.fillRect(x - mortarWidth / 2, y, mortarWidth, brickHeight);
      ctx.fillRect(x, y - mortarWidth / 2, brickWidth, mortarWidth);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;

  return texture;
}

/**
 * Helper function to create a simple procedural texture using canvas
 * Creates a noisy texture pattern for more realistic terrain
 */
function createProceduralTexture(
  baseColor: string,
  variation: number = 0.3
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Parse base color
  const tempDiv = document.createElement("div");
  tempDiv.style.color = baseColor;
  document.body.appendChild(tempDiv);
  const computedColor = window.getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);

  const rgb = computedColor.match(/\d+/g)?.map(Number) || [128, 128, 128];

  // Create noisy texture with more variation
  const imageData = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const noise = (Math.random() - 0.5) * variation * 255;

      imageData.data[i] = Math.max(0, Math.min(255, rgb[0] + noise)); // R
      imageData.data[i + 1] = Math.max(0, Math.min(255, rgb[1] + noise)); // G
      imageData.data[i + 2] = Math.max(0, Math.min(255, rgb[2] + noise)); // B
      imageData.data[i + 3] = 255; // A
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;

  return texture;
}

/**
 * TerrainBlock Component
 * Exactly 20 different natural terrain types
 * Features procedural textures and varied geometry for rough blocks
 *
 * Blocks with procedural textures (13):
 * - Grass, Stone, Sand, Snow, Wood, Dirt, Clay
 * - Cobblestone, Bricks (special pattern), Sandstone, Gravel, Mud, Limestone
 *
 * Blocks with solid colors only (7):
 * - Ice, Crystal, Obsidian, Marble
 * - Gold, Silver, Copper
 */
export default function TerrainBlock({ name }: { name: string }) {
  // Create textures using useMemo for better performance
  const texture = useMemo(() => {
    switch (name) {
      case "Grass":
        return createProceduralTexture("#8c8d52", 0.25);
      case "Stone":
        return createProceduralTexture("#666666", 0.35);
      case "Sand":
        return createProceduralTexture("#e8d4a0", 0.2);
      case "Snow":
        return createProceduralTexture("#f0f8ff", 0.15);
      case "Wood":
        return createProceduralTexture("#8b4513", 0.4);
      case "Dirt":
        return createProceduralTexture("#5c4033", 0.35);
      case "Clay":
        return createProceduralTexture("#c2855c", 0.25);
      case "Cobblestone":
        return createProceduralTexture("#707070", 0.45);
      case "Bricks":
        return createBrickTexture("#a0522d", "#8b7355");
      case "Sandstone":
        return createProceduralTexture("#d4a574", 0.2);
      case "Gravel":
        return createProceduralTexture("#8b8680", 0.5);
      case "Mud":
        return createProceduralTexture("#3d2817", 0.3);
      case "Limestone":
        return createProceduralTexture("#e3dac9", 0.2);
      default:
        return null;
    }
  }, [name]);

  // Define geometry variations - rough blocks have slightly irregular dimensions
  const geometry = useMemo(() => {
    const baseSize = [1.21, 1.01, 1.21];

    switch (name) {
      case "Stone":
      case "Dirt":
      case "Sand":
      case "Gravel":
      case "Mud":
        // Very rough/irregular blocks
        return [
          baseSize[0] + (Math.random() - 0.5) * 0.08,
          baseSize[1] + (Math.random() - 0.5) * 0.08,
          baseSize[2] + (Math.random() - 0.5) * 0.08,
        ] as [number, number, number];
      case "Grass":
      case "Wood":
      case "Clay":
      case "Cobblestone":
      case "Sandstone":
      case "Limestone":
        // Moderately rough
        return [
          baseSize[0] + (Math.random() - 0.5) * 0.04,
          baseSize[1] + (Math.random() - 0.5) * 0.04,
          baseSize[2] + (Math.random() - 0.5) * 0.04,
        ] as [number, number, number];
      default:
        // Smooth, perfect blocks
        return baseSize as [number, number, number];
    }
  }, [name]);

  const position = [0, 0.5, 0] as [number, number, number];

  switch (name) {
    case "Grass":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#8c8d52"
            roughness={0.75}
            metalness={0.0}
          />
        </mesh>
      );
    case "Stone":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#666666"
            roughness={0.85}
            metalness={0.0}
          />
        </mesh>
      );
    case "Sand":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#e8d4a0"
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      );
    case "Snow":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#f0f8ff"
            roughness={0.5}
            metalness={0.0}
          />
        </mesh>
      );
    case "Wood":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#8b4513"
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>
      );
    case "Ice":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            color="#a8d5ff"
            roughness={0.05}
            metalness={0.4}
            transparent
            opacity={0.6}
          />
        </mesh>
      );
    case "Dirt":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#5c4033"
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      );
    case "Clay":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#c2855c"
            roughness={0.75}
            metalness={0.0}
          />
        </mesh>
      );
    case "Cobblestone":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#707070"
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      );
    case "Bricks":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#a0522d"
            roughness={0.8}
            metalness={0.0}
          />
        </mesh>
      );
    case "Sandstone":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#d4a574"
            roughness={0.7}
            metalness={0.0}
          />
        </mesh>
      );
    case "Gravel":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#8b8680"
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>
      );
    case "Mud":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#3d2817"
            roughness={0.85}
            metalness={0.0}
          />
        </mesh>
      );
    case "Limestone":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            map={texture}
            color="#e3dac9"
            roughness={0.65}
            metalness={0.0}
          />
        </mesh>
      );
    case "Crystal":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            color="#b19cd9"
            roughness={0.05}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
      );
    case "Obsidian":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
      );
    case "Marble":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            color="#f5f5f5"
            roughness={0.2}
            metalness={0.25}
          />
        </mesh>
      );
    case "Gold":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            color="#ffd700"
            roughness={0.25}
            metalness={0.92}
          />
        </mesh>
      );
    case "Silver":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            color="#c0c0c0"
            roughness={0.2}
            metalness={0.95}
          />
        </mesh>
      );
    case "Copper":
      return (
        <mesh castShadow receiveShadow position={position}>
          <boxGeometry args={geometry} />
          <meshStandardMaterial
            color="#b87333"
            roughness={0.3}
            metalness={0.88}
          />
        </mesh>
      );
    default:
      return null;
  }
}
