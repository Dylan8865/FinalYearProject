"use client";

import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { Mesh } from "three";

interface ModelProps {
  path: string;
  scale?: number;
  position?: [number, number, number];
}

export default function Model({
  path,
  scale = 1,
  position = [0, 0, 0],
}: ModelProps) {
  const { scene } = useGLTF(path);
  const ref = useRef<Mesh>(null);

  return (
    <primitive ref={ref} object={scene} scale={scale} position={position} />
  );
}
