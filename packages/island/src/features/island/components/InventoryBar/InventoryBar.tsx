"use client";

import React from "react";
import Image from "next/image";
import InventoryButton from "./InventoryButton";
import MenuIcon from "@/features/shared/icons/MenuIcon";
import StoreIcon from "@/features/shared/icons/StoreIcon";
import QuestionIcon from "@/features/shared/icons/QuestionIcon";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";

interface InventoryBarProps {
  setIsDialogOpen: React.Dispatch<React.SetStateAction<string>>;
  onItemClick?: (item: any, index: number) => void;
  onSlotClick?: (slotX: number, slotY: number) => void;
}

/**
 * InventoryBar Component
 * 
 * Displays a horizontal bar at the bottom of the screen showing the user's hotbar items.
 * Items in positions (pos_x: 0-9, pos_y: 0) are displayed in the hotbar.
 * 
 * Features:
 * - Displays up to 10 items in a horizontal layout
 * - Shows item thumbnails from image_cover_url (pre-resolved from API) or a placeholder icon
 * - Supports drag-and-drop to place items on the island
 * - Provides buttons to open inventory and store dialogs
 * 
 * @param setIsDialogOpen - Function to control which dialog is open
 * @param onItemClick - Callback when user clicks an item
 * @param onSlotClick - Callback when user clicks an empty slot
 */
const InventoryBar = ({
  setIsDialogOpen,
  onItemClick,
  onSlotClick,
}: InventoryBarProps) => {
  // Fetch all island items from context
  const { islandItems } = useIslandItemsContext();

  // Simple mapping: Each item occupies its own slot
  // No grouping or stacking - cleaner and simpler
  const hotbarItems = React.useMemo(() => {
    console.log("Loading hotbar items, total islandItems:", islandItems.length);

    return Array.from({ length: 10 }).map((_, index) => {
      // Get the item at this exact position
      return islandItems.find(
        (item) => item.pos_x === index && item.pos_y === 0
      ) || null;
    });
  }, [islandItems]);

  // Debug: Log hotbar items
  console.log("Hotbar items:", hotbarItems.map(item => ({
    name: item?.item?.name,
    pos_x: item?.pos_x,
    pos_y: item?.pos_y,
  })));

  return (
    <div className="pointer-events-none z-0 flex w-screen items-center justify-center">
      <div className="pointer-events-auto z-20 h-10 w-fit bg-black px-4">
        <div className="mt-[-24px] flex items-center justify-center gap-2">
          {hotbarItems.map((item, index) => (
            <InventoryButton
              key={`slot-${index}-${item?.id || 'empty'}`}
              className="bg-[#d9d9d9] text-black relative"
              onClick={() => {
                if (item && onItemClick) {
                  console.log("Item clicked:", item.item?.name);
                  onItemClick(item, index);
                } else if (!item && onSlotClick) {
                  // Empty slot clicked - move selected placed item here
                  console.log("Empty slot clicked:", index);
                  onSlotClick(index, 0);
                }
              }}
            >
              {item && item.item?.image_cover_url ? (
                <Image
                  src={item.item.image_cover_url}
                  alt={item.item.name || "Item"}
                  width={30}
                  height={30}
                  className="object-contain"
                  draggable={false}
                  unoptimized
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
