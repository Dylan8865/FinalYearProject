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
 * @param onItemDragStart - Callback when user starts dragging an item
 * @param onItemDragEnd - Callback when user stops dragging an item
 */
const InventoryBar = ({
  setIsDialogOpen,
  onItemDragStart,
  onItemDragEnd,
  onSlotClick,
}: InventoryBarProps) => {
  // Fetch all island items from context
  const { islandItems } = useIslandItemsContext();

  // Filter items for hotbar: pos_y === 0, pos_x === 0-9
  // Group items by position and calculate quantities
  const hotbarItems = React.useMemo(() => {
    console.log("📦 Recalculating hotbar items, total islandItems:", islandItems.length);

    return Array.from({ length: 10 }).map((_, index) => {
      // Get ALL items at this position (pos_x = index, pos_y = 0)
      const itemsAtPosition = islandItems.filter(
        (item) => item.pos_x === index && item.pos_y === 0
      );

      if (itemsAtPosition.length === 0) return null;

      // Group by item_id and count
      const grouped = itemsAtPosition.reduce((acc, item) => {
        const key = item.item_id || 'unknown';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {} as Record<string, typeof itemsAtPosition>);

      // Get the first group (should only be one item_id per slot)
      const firstGroup = Object.values(grouped)[0];
      if (!firstGroup || firstGroup.length === 0) return null;

      // Return the first item with calculated quantity
      return {
        ...firstGroup[0],
        quantity: firstGroup.length,
        allIds: firstGroup.map(i => i.id), // Store all IDs for potential future use
      };
    });
  }, [islandItems]);

  // Debug: Log hotbar items with quantities
  console.log("Hotbar items with quantities:", hotbarItems.map(item => ({
    name: item?.item?.name,
    quantity: item?.quantity,
    allIds: item?.allIds,
    pos_x: item?.pos_x,
    pos_y: item?.pos_y,
  })));

  return (
    <div className="pointer-events-none z-0 flex w-screen items-center justify-center">
      <div className="pointer-events-auto z-20 h-10 w-fit bg-black px-4">
        <div className="mt-[-24px] flex items-center justify-center gap-2">
          {hotbarItems.map((item, index) => (
            <InventoryButton
              key={`slot-${index}-${item?.id}-${item?.quantity || 0}`}
              className="bg-[#d9d9d9] text-black relative"
              onClick={() => {
                if (item && onItemDragStart) {
                  console.log("Item clicked:", item.item?.name);
                  onItemDragStart(item, index);
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

              {/* Quantity Badge */}
              {item && (item.quantity ?? 1) > 1 && (
                <div className="absolute bottom-0 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black/80 px-1 text-[10px] font-bold text-white">
                  {item.quantity}
                </div>
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
