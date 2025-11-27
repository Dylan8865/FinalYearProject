"use client";

import React from "react";
import StatusBar from "./StatusBar";
import InventoryBar from "./InventoryBar";
import IslandCanvas from "./IslandCanvas";

const IslandPage = () => {
  return (
    <div className="w-screen h-screen relative bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
      <div className="absolute top-0 left-0 right-0 z-10">
        <StatusBar />
      </div>
      <div className="absolute inset-0 z-0">
        <IslandCanvas />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <InventoryBar />
      </div>
    </div>
  );
};

export default IslandPage;
