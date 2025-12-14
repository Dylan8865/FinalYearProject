import React, { useState } from "react";
import { IslandItemType } from "@/types/types";
import QuestionIcon from "@/features/shared/icons/QuestionIcon";
import TrashIcon from "@/features/shared/icons/TrashIcon";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";
import Image from "next/image";

interface InventoryContentProps {
  selectedPlacedItem?: string | null;
  onSelect?: (itemId: string | null) => void;
}

const InventoryContent = ({ selectedPlacedItem, onSelect }: InventoryContentProps) => {
  const { islandItems, loading, updateItemPosition, deleteItem } =
    useIslandItemsContext();
    
    // Local state for selection if not controlled by parent (fallback)
   const [localSelected, setLocalSelected] = useState<string | null>(null);
   
   // Use controlled state if available, otherwise local
   const selectedId = selectedPlacedItem !== undefined ? selectedPlacedItem : localSelected;
   const handleSelect = onSelect || setLocalSelected;

  const handleSlotClick = async (x: number, y: number) => {
    // If nothing selected, try to select item in slot
    if (!selectedId) {
        const itemInSlot = islandItems.find(i => i.pos_x === x && i.pos_y === y);
        if (itemInSlot) {
            handleSelect(itemInSlot.id);
        }
        return;
    }

    // Something is selected
    const selectedItem = islandItems.find(i => i.id === selectedId);
    
    // If selected item is not in inventory (e.g. placed), and we click a slot
    if (!selectedItem) {
        // Parent context handles "Placed -> Inventory" move usually. 
        // But here we are inside the Inventory Modal.
        // Usually the Inventory Modal doesn't show up when placing items?
        // If we are in "Inventory Mode", selectedPlacedItem comes from hotbar?
        // Let's assume standard behavior:
        // If we click an empty slot, valid logic is move.
        // If we click an occupied slot, valid logic is select (if placed) or swap (if placed?).
        // Actually, if item is placed, `updateItemPosition` handles "Move to Inventory" if we give it safe X,Y.
        
        // Let's simplify: If selected item is NOT found in `islandItems`, it means it's NOT in the inventory list?
        // WAIT. `islandItems` includes ALL items belonging to profile, including `is_placed`.
        // Let's check `IslandItemType` definition.
        // Usually `islandItems` from context are ALL items.
        // So `selectedItem` should be found.
        return;
    }

    // Check target slot
    const targetItem = islandItems.find(i => i.pos_x === x && i.pos_y === y);

    if (targetItem) {
        if (targetItem.id === selectedId) {
            // Clicked self -> Deselect
            handleSelect(null);
        } else {
            // Clicked other item -> Swap
            await updateItemPosition(selectedId, x, y);
            await updateItemPosition(targetItem.id, selectedItem.pos_x ?? 0, selectedItem.pos_y ?? 0);
            // Optional: Keep selection on moved item or deselect?
            // Deselecting is safer to avoid confusion
             handleSelect(null);
        }
    } else {
        // Empty slot -> Move
        await updateItemPosition(selectedId, x, y);
        handleSelect(null);
    }
  };

  const handleTrashClick = () => {
      if (selectedId) {
          deleteItem(selectedId);
          handleSelect(null);
      }
  };

  if (loading) {
    return <div className="text-center">Loading inventory...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-10 gap-4">
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => {
            // Find item at this inventory position
            // IMPORTANT: Only show items that are NOT on the island grid
            const item = islandItems.find(
              (i) => 
                i.pos_x === col && 
                i.pos_y === row &&
                i.grid_x === null && // Must NOT be on grid
                i.grid_y === null &&
                i.grid_z === null &&
                i.island_id === null // Must NOT be assigned to an island
            );
            
            const isSelected = item && item.id === selectedId;

            return (
              <div
                key={`${row}-${col}`}
                className={`${row == 0 ? "bg-[#d9d9d9] text-black" : "bg-[#8b8b8b]"} ${isSelected ? "bg-[#fbbf24]" : ""} relative flex h-16 w-16 items-center justify-center overflow-hidden transition-all cursor-pointer hover:scale-110`}
                onClick={() => handleSlotClick(col, row)}
              >
                {item && item.item?.image_cover_url ? (
                  <Image
                    src={item.item.image_cover_url}
                    alt={item.item.name || "Item"}
                    width={50}
                    height={50}
                    className="object-contain"
                    draggable={false}
                    unoptimized
                  />
                ) : (
                  item && <QuestionIcon />
                )}

                {/* Quantity Badge */}
                {item && (item.quantity ?? 1) > 1 && (
                  <div className="absolute bottom-1 right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black/80 px-1.5 text-xs font-bold text-white">
                    {item.quantity}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div
        className={`absolute bottom-8 right-9 text-3xl transition-colors cursor-pointer hover:scale-110 active:scale-95 ${selectedId ? "text-red-500 animate-pulse" : "text-gray-400"}`}
        onClick={handleTrashClick}
      >
        <TrashIcon />
      </div>
    </>
  );
};

export default InventoryContent;
