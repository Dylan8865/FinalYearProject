import React, { useState } from "react";
import { IslandItemType } from "@/types/types";
import QuestionIcon from "@/features/shared/icons/QuestionIcon";
import TrashIcon from "@/features/shared/icons/TrashIcon";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";
import Image from "next/image";

const InventoryContent = () => {
  const { islandItems, loading, updateItemPosition, deleteItem } =
    useIslandItemsContext();
  const [draggedItem, setDraggedItem] = useState<{
    item: IslandItemType;
    fromX: number;
    fromY: number;
  } | null>(null);
  const [isTrashHovered, setIsTrashHovered] = useState(false);

  const handleDragStart = (
    e: React.DragEvent,
    item: IslandItemType,
    x: number,
    y: number
  ) => {
    setDraggedItem({ item, fromX: x, fromY: y });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, toX: number, toY: number) => {
    e.preventDefault();

    if (!draggedItem) return;

    const { item, fromX, fromY } = draggedItem;

    // Check if target slot is empty or swap items
    const targetItem = islandItems.find(
      (i) => i.pos_x === toX && i.pos_y === toY
    );

    if (targetItem) {
      // Swap items - no await, happens in background
      updateItemPosition(item.id, toX, toY);
      updateItemPosition(targetItem.id, fromX, fromY);
    } else {
      // Move to empty slot - no await, happens in background
      updateItemPosition(item.id, toX, toY);
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsTrashHovered(false);
  };

  const handleTrashDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsTrashHovered(true);
  };

  const handleTrashDragLeave = () => {
    setIsTrashHovered(false);
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedItem) return;

    // Delete item - optimistic update and background deletion
    deleteItem(draggedItem.item.id);

    setDraggedItem(null);
    setIsTrashHovered(false);
  };

  if (loading) {
    return <div className="text-center">Loading inventory...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-10 gap-4">
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => {
            const item = islandItems.find(
              (i) => i.pos_x === col && i.pos_y === row
            );

            return (
              <div
                key={`${row}-${col}`}
                className={`${row == 0 ? "bg-[#d9d9d9] text-black" : "bg-[#8b8b8b]"} relative flex h-16 w-16 items-center justify-center overflow-hidden transition-opacity ${item ? "cursor-grab active:cursor-grabbing" : ""} ${draggedItem?.fromX === col && draggedItem?.fromY === row ? "opacity-50" : ""}`}
                draggable={!!item}
                onDragStart={(e) => item && handleDragStart(e, item, col, row)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col, row)}
                onDragEnd={handleDragEnd}
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
        className={`absolute bottom-8 right-9 text-3xl transition-colors ${isTrashHovered ? "text-red-500" : ""}`}
        onDragOver={handleTrashDragOver}
        onDragLeave={handleTrashDragLeave}
        onDrop={handleTrashDrop}
      >
        <TrashIcon />
      </div>
    </>
  );
};

export default InventoryContent;
