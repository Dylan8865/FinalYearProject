"use client";

import React from "react";
import InventoryButton from "./InventoryButton";
import MenuIcon from "../icons/MenuIcon";
import StoreIcon from "../icons/StoreIcon";

interface InventoryBarProps {
  setIsDialogOpen: React.Dispatch<React.SetStateAction<string>>;
}

const InventoryBar = ({ setIsDialogOpen }: InventoryBarProps) => {
  return (
    <div className="z-0 flex justify-center items-center w-screen pointer-events-none">
      <div className="z-20 w-fit bg-black h-10 px-4 pointer-events-auto">
        <div className="mt-[-24px] flex gap-2 justify-center items-center">
          {Array.from({ length: 10 }).map((_, index) => (
            <InventoryButton key={index} className="bg-[#d9d9d9]" />
          ))}
          <div className="flex gap-2 ml-4">
            <InventoryButton
              className="bg-[#dcd1c1]"
              onClick={() => setIsDialogOpen("inventory")}
            >
              <MenuIcon />
            </InventoryButton>
            <InventoryButton
              className="bg-[#dcd1c1] text-2xl"
              onClick={() => setIsDialogOpen("store")}
            >
              <StoreIcon />
            </InventoryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryBar;
