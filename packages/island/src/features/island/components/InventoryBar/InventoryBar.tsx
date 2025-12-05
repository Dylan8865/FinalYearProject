"use client";

import React from "react";
import InventoryButton from "./InventoryButton";
import MenuIcon from "@/icons/MenuIcon";
import StoreIcon from "@/icons/StoreIcon";
import QuestionIcon from "@/icons/QuestionIcon";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";

interface InventoryBarProps {
  setIsDialogOpen: React.Dispatch<React.SetStateAction<string>>;
  onItemDragStart?: (item: any, index: number) => void;
  onItemDragEnd?: () => void;
}

const InventoryBar = ({
  setIsDialogOpen,
  onItemDragStart,
  onItemDragEnd,
}: InventoryBarProps) => {
  const { islandItems } = useIslandItemsContext();

  const hotbarItems = Array.from({ length: 10 }).map((_, index) => {
    return islandItems.find((item) => item.pos_x === index && item.pos_y === 0);
  });

  const handleDragStart = (e: React.DragEvent, item: any, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("itemId", item.id);
    e.dataTransfer.setData("itemIndex", index.toString());
    if (onItemDragStart) {
      onItemDragStart(item, index);
    }
  };

  const handleDragEnd = () => {
    if (onItemDragEnd) {
      onItemDragEnd();
    }
  };

  return (
    <div className="pointer-events-none z-0 flex w-screen items-center justify-center">
      <div className="pointer-events-auto z-20 h-10 w-fit bg-black px-4">
        <div className="mt-[-24px] flex items-center justify-center gap-2">
          {hotbarItems.map((item, index) => (
            <InventoryButton
              key={index}
              className="bg-[#d9d9d9] text-black"
              draggable={!!item}
              onDragStart={(e) => item && handleDragStart(e, item, index)}
              onDragEnd={handleDragEnd}
            >
              {item && <QuestionIcon />}
            </InventoryButton>
          ))}
          <div className="ml-4 flex gap-2">
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
