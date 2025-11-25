"use client";

interface IslandProps {
  size?: [number, number, number];
  position?: [number, number, number];
  color?: string;
}

export default function Island({ size, position, color }: IslandProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
