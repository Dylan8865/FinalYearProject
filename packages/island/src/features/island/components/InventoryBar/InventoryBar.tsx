"use client";

import React from "react";
import Image from "next/image";
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

/**
 * InventoryBar Component
 * 
 * Displays a horizontal bar at the bottom of the screen showing the user's hotbar items.
 * Items in positions (pos_x: 0-9, pos_y: 0) are displayed in the hotbar.
 * 
 * Features:
 * - Displays up to 10 items in a horizontal layout
 * - Shows item thumbnails from image_cover_path or a placeholder icon
 * - Supports drag-and-drop to place items on the island
 * - Provides buttons to open inventory and store dialogs
 * 
 * @param setIsDialogOpen - Function to control which dialog is open
 * @param onItemDragStart - Callback when user starts dragging an item
 * @param onItemDragEnd - Callback when user stops dragging an item
 */
const InventoryBar = ({
  setIsDialogOpen,
  onItemDragStart,
  onItemDragEnd,
}: InventoryBarProps) => {
  // Fetch all island items from context
  const { islandItems } = useIslandItemsContext();

  // Filter items for hotbar: pos_y === 0, pos_x === 0-9
  // Creates an array of 10 slots and fills them with matching items
  const hotbarItems = Array.from({ length: 10 }).map((_, index) => {
    return islandItems.find((item) => item.pos_x === index && item.pos_y === 0);
  });

  return (
    <div className="pointer-events-none z-0 flex w-screen items-center justify-center">
      <div className="pointer-events-auto z-20 h-10 w-fit bg-black px-4">
        <div className="mt-[-24px] flex items-center justify-center gap-2">
          {hotbarItems.map((item, index) => (
            <InventoryButton
              key={index}
              className="bg-[#d9d9d9] text-black"
              onClick={() => {
                if (item && onItemDragStart) {
                  console.log("📦 Item clicked:", item.item?.name);
                  onItemDragStart(item, index);
                }
              }}
            >
              {item && item.item?.image_cover_path ? (
                <Image
                  src={item.item.image_cover_path}
                  alt={item.item.name || "Item"}
                  width={32}
                  height={32}
                  className="object-contain"
                  draggable={false}
                />
              ) : (
                item && <QuestionIcon />
              )}
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
