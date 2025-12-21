"use client";
import React, { useState } from "react";
import QuestionIcon from "@/icons/QuestionIcon";
import TrashIcon from "@/icons/TrashIcon";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";
import Image from "next/image";
import { IslandItemType } from "@/types/types";
import SlotTooltip from "./SlotTooltip";
import { toCapitalise } from "@/lib/capitalise";
import { useTheme } from "../../contexts/ThemeContext";

interface InventoryContentProps {
  selectedPlacedItem?: string | null;
  onSelect?: (itemId: string | null) => void;
}

const InventoryContent = ({
  selectedPlacedItem,
  onSelect,
}: InventoryContentProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const { islandItems, loading, updateItemPosition, deleteItem } =
    useIslandItemsContext();

  const [localSelected, setLocalSelected] = useState<string | null>(null);

  const selectedId =
    selectedPlacedItem !== undefined ? selectedPlacedItem : localSelected;
  const handleSelect = onSelect || setLocalSelected;

  const handleSlotClick = async (x: number, y: number) => {
    if (!selectedId) {
      const itemInSlot = islandItems.find(
        (i) => i.pos_x === x && i.pos_y === y
      );
      if (itemInSlot) {
        handleSelect(itemInSlot.id);
      }
      return;
    }

    const selectedItem = islandItems.find((i) => i.id === selectedId);
    if (!selectedItem) return;

    const targetItem = islandItems.find((i) => i.pos_x === x && i.pos_y === y);

    if (targetItem) {
      if (targetItem.id === selectedId) {
        handleSelect(null);
      } else {
        await updateItemPosition(selectedId, x, y);
        await updateItemPosition(
          targetItem.id,
          selectedItem.pos_x ?? 0,
          selectedItem.pos_y ?? 0
        );
        handleSelect(null);
      }
    } else {
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

  const [showTooltip, setShowTooltip] = useState<IslandItemType | null>();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <div className="relative h-[400px] overflow-y-scroll md:h-fit md:overflow-visible">
      <div className="grid grid-cols-5 gap-4 md:grid-cols-10">
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => {
            const item = islandItems.find(
              (i) =>
                i.pos_x === col &&
                i.pos_y === row &&
                i.grid_x === null &&
                i.grid_y === null &&
                i.grid_z === null &&
                i.island_id === null
            );

            const isSelected = item && item.id === selectedId;

            return (
              <button
                key={`${row}-${col}`}
                className={`${
                  row == 0
                    ? isDark
                      ? "bg-[#d9d9d9] text-black"
                      : "bg-[#e5e7eb] text-black"
                    : isDark
                      ? "bg-[#4b5563]"
                      : "bg-[#d1d5db]"
                } ${isSelected ? "bg-[#fbbf24]" : ""} relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden transition-all hover:scale-110 md:h-16 md:w-16`}
                onClick={() => handleSlotClick(col, row)}
                onMouseEnter={() => setShowTooltip(item || null)}
                onMouseLeave={() => setShowTooltip(null)}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
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
              </button>
            );
          })
        )}
      </div>
      <div
        className={`fixed bottom-[240px] right-[33px] cursor-pointer text-3xl transition-colors hover:scale-110 active:scale-95 md:absolute md:bottom-[-5px] md:right-[-65px] ${selectedId ? "animate-pulse text-red-500" : isDark ? "text-gray-400" : "text-gray-600"}`}
        onClick={handleTrashClick}
      >
        <TrashIcon />
      </div>
      {showTooltip && (
        <SlotTooltip
          title={showTooltip.item?.name || ""}
          description={[
            `Type: ${toCapitalise(showTooltip.item?.type ?? "")}`,
            `Mana Rate: ${showTooltip.item?.mana_rate ?? 0}/m`,
            "Click To Move",
          ]}
          x={mousePos.x}
          y={mousePos.y}
        />
      )}
    </div>
  );
};

export default InventoryContent;
