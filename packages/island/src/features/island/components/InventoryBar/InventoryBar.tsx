"use client";

import React, { useState } from "react";
import Image from "next/image";
import InventoryButton from "./InventoryButton";
import MenuIcon from "@/icons/MenuIcon";
import StoreIcon from "@/icons/StoreIcon";
import QuestionIcon from "@/icons/QuestionIcon";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";
import { ItemType } from "@/types/types";
import SlotTooltip from "../Dialog/SlotTooltip";
import { toCapitalise } from "@/lib/capitalise";

interface InventoryBarProps {
  selectedPlacedItem: string | null;
  setSelectedPlacedItem: React.Dispatch<React.SetStateAction<string | null>>;
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
  selectedPlacedItem,
  setSelectedPlacedItem,
  setIsDialogOpen,
  onItemClick,
  onSlotClick,
}: InventoryBarProps) => {
  // Fetch all island items from context
  const { islandItems, updateItemPosition } = useIslandItemsContext();

  const handleSlotClick = async (index: number) => {
    console.log("=== INVENTORY BAR SLOT CLICKED ===");
    console.log("Slot index:", index);
    console.log("Selected item ID:", selectedPlacedItem);

    // If no item selected, do nothing
    if (!selectedPlacedItem) return;

    // Find the currently selected item in the inventory data to check its location
    const draggedItem = islandItems.find((i) => i.id === selectedPlacedItem);
    console.log("Dragged item found:", draggedItem);
    console.log(
      "Dragged item location:",
      draggedItem
        ? {
            pos_x: draggedItem.pos_x,
            pos_y: draggedItem.pos_y,
            grid_x: draggedItem.grid_x,
            grid_y: draggedItem.grid_y,
            grid_z: draggedItem.grid_z,
            island_id: draggedItem.island_id,
          }
        : "not found"
    );

    // Check if the selected item is currently on the island grid (has grid coordinates)
    const isOnIsland =
      draggedItem &&
      draggedItem.grid_x !== null &&
      draggedItem.grid_y !== null &&
      draggedItem.grid_z !== null;

    if (isOnIsland) {
      // Item is on island - delegate to parent's onSlotClick to move it to inventory
      console.log(
        "Item is on island, calling onSlotClick to move to inventory"
      );
      onSlotClick?.(index, 0);
      return;
    }

    // Item is in inventory - handle the move/swap here
    if (draggedItem && draggedItem.pos_x !== null) {
      const targetItem = islandItems.find(
        (i) => i.pos_x === index && i.pos_y === 0 && i.grid_x === null
      );

      if (targetItem) {
        if (targetItem.id === selectedPlacedItem) {
          // Clicked self - deselect
          return;
        }
        // Swap
        console.log("Swapping items");
        await updateItemPosition(selectedPlacedItem, index, 0);
        await updateItemPosition(
          targetItem.id,
          draggedItem.pos_x ?? 0,
          draggedItem.pos_y ?? 0
        );
      } else {
        // Move to empty
        console.log("Moving to empty slot");
        await updateItemPosition(selectedPlacedItem, index, 0);
      }
      setSelectedPlacedItem(null);
    }
  };

  // Simple mapping: Each item occupies its own slot
  // No grouping or stacking - cleaner and simpler
  const hotbarItems = React.useMemo(() => {
    return Array.from({ length: 10 }).map((_, index) => {
      // Get the item at this exact position
      // IMPORTANT: Only include items that are NOT on the island grid
      // Items with grid_x set are placed on the island and should not appear here
      return (
        islandItems.find(
          (item) =>
            item.pos_x === index &&
            item.pos_y === 0 &&
            item.grid_x === null && // Must NOT be on grid
            item.grid_y === null &&
            item.grid_z === null &&
            item.island_id === null // Must NOT be assigned to an island
        ) || null
      );
    });
  }, [islandItems]);

  const [showTooltip, setShowTooltip] = useState<ItemType | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <>
      <div className="pointer-events-none z-0 flex w-screen items-center justify-center">
        <div className="pointer-events-auto z-20 flex h-full w-full items-center justify-center bg-black px-4 pb-4 md:h-10 md:w-fit md:pb-0">
          <div className="mt-[-24px] grid w-96 grid-cols-6 items-center justify-center gap-2 md:flex md:w-full">
            {hotbarItems.map((islandItem, index) => (
              <InventoryButton
                key={`slot-${index}-${islandItem?.id || "empty"}`}
                className={`${islandItem && selectedPlacedItem === islandItem.id ? "bg-[#fbbf24]" : "bg-[#d9d9d9] hover:bg-[#808080]"} relative text-black transition-colors ${index === 6 ? "md:ml-0" : ""}`}
                onClick={() => {
                  // If we have a selection that is NOT the current item, try to move/swap first
                  // Use explicit islandItem.id for comparison (unique instance ID)
                  if (
                    selectedPlacedItem &&
                    selectedPlacedItem !== islandItem?.id
                  ) {
                    const selectedItemInstance = islandItems.find(
                      (i) => i.id === selectedPlacedItem
                    );
                    if (selectedItemInstance) {
                      // Selected item is in inventory -> Swap/Move logic
                      handleSlotClick(index);
                      return;
                    }

                    if (!islandItem && onSlotClick) {
                      onSlotClick(index, 0);
                      return;
                    }
                  }

                  // Deselect if already selected
                  if (
                    islandItem &&
                    selectedPlacedItem === islandItem.id &&
                    onItemClick
                  ) {
                    onItemClick(null, index);
                    return;
                  }

                  if (islandItem && onItemClick) {
                    console.log("Item clicked (Unique ID):", islandItem.id);
                    onItemClick(islandItem, index);
                  } else if (!islandItem && onSlotClick) {
                    onSlotClick(index, 0);
                  }
                }}
                onMouseEnter={() => setShowTooltip(islandItem?.item || null)}
                onMouseLeave={() => setShowTooltip(null)}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              >
                {islandItem && islandItem.item?.image_cover_url ? (
                  <Image
                    src={islandItem.item.image_cover_url}
                    alt={islandItem.item.name || "Item"}
                    width={30}
                    height={30}
                    className="object-contain"
                    draggable={false}
                    unoptimized
                  />
                ) : (
                  islandItem && <QuestionIcon />
                )}
              </InventoryButton>
            ))}
            <div className="ml-0 flex w-fit gap-2 md:ml-4">
              <InventoryButton
                className="bg-[#dcd1c1] hover:bg-[#aaa194]"
                onClick={() => setIsDialogOpen("inventory")}
              >
                <MenuIcon />
              </InventoryButton>
              <InventoryButton
                className="bg-[#dcd1c1] text-2xl hover:bg-[#aaa194]"
                onClick={() => setIsDialogOpen("store")}
              >
                <StoreIcon />
              </InventoryButton>
            </div>
          </div>
        </div>
      </div>
      {showTooltip && (
        <SlotTooltip
          title={showTooltip.name || ""}
          description={[
            `Type: ${toCapitalise(showTooltip.type ?? "")}`,
            `Mana Rate: ${showTooltip.mana_rate}/m`,
            "Click To Move",
          ]}
          x={mousePos.x}
          y={mousePos.y - 100}
        />
      )}
    </>
  );
};

export default React.memo(InventoryBar);
