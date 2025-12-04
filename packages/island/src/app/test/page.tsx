"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export default function Test() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = supabase.storage
      .from("items")
      .getPublicUrl("f612693e-b042-4a72-95f8-0736d7980a26.glb");

    setUrl(data.publicUrl);
  }, []);

  if (!url) return <div>Loading model...</div>;

  return (
    <Canvas camera={{ position: [2, 2, 2] }}>
      <ambientLight intensity={1} />
      <pointLight position={[10, 10, 10]} />
      <Model url={url} />
      <OrbitControls />
    </Canvas>
  );
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}
