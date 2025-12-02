"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import IslandIcon from "@/features/island/icons/IslandIcon";

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the first user's island page
    router.push("/mike/island");
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div>Redirecting to island...</div>
    </div>
  );
};

export default Home;
