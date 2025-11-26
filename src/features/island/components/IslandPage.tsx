"use client";
import React from "react";
import StatusBar from "./StatusBar";
import InventoryBar from "./InventoryBar";

const IslandPage = () => {
  return (
    <div className="w-screen h-screen flex flex-col justify-between bg-gradient-to-b from-[#72b9e3] from-[37%] to-[#ffffff] to-[100%]">
      <StatusBar />
      <InventoryBar />
    </div>
  );
};

export default IslandPage;
