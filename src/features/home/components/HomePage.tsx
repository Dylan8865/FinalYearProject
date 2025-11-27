"use client";

import Island from "@/components/island";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useState, useEffect } from "react";

const HomePage = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    (() => setIsMounted(true))();
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <Canvas>
        <directionalLight position={[0, 0, 1]} intensity={1} />
        <ambientLight intensity={0.2} />

        {/* <Model
          path="/models/ "
          scale={5}
          position={[0, 0, 0]}
        /> */}
        <Island />

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
};

export default HomePage;
