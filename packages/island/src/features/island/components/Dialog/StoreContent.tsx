"use client";

import React, { useState } from "react";
import { useItems } from "@/features/island/hooks/useItems";
import { useIslandItemsContext } from "@/features/island/contexts/IslandItemsContext";
import FileIcon from "@/icons/FileIcon";
import { ItemType, ProfileType } from "@/types/types";
import SeedlingIcon from "@/icons/SeedlingIcon";
import BlockIcon from "@/icons/BlockIcon";
import ManaIcon from "@/icons/ManaIcon";
import { ScrollArea } from "@/features/island/components/Dialog/ScrollArea";
import QuestionIcon from "@/icons/QuestionIcon";
import Dialog from "./Dialog";
import ExclaimationIcon from "@/icons/ExclaimationIcon";
import Button from "./Button";
import Image from "next/image";
import SlotTooltip from "./SlotTooltip";
import { useToast } from "@/features/island/contexts/ToastContext";
import LoadingScreen from "../Shared/LoadingScreen";
import { useTheme } from "../../contexts/ThemeContext";

interface StoreRowProps {
  items: ItemType[];
  category: string;
  icon: React.ReactNode;
  setSelectedItem: React.Dispatch<React.SetStateAction<ItemType | null>>;
}

const StoreRow = ({
  items,
  category,
  icon,
  setSelectedItem,
}: StoreRowProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const [showTooltip, setShowTooltip] = useState<ItemType | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <>
      <div className="space-y-2">
        <div
          className={`flex items-center gap-2 text-sm md:text-lg ${isDark ? "text-white" : "text-black"}`}
        >
          {icon}
          <h1>{category}</h1>
        </div>
        <div className="grid grid-cols-4 gap-4 md:grid-cols-10">
          {items
            .filter((item) => item.type === category.toLowerCase())
            .map((item) => (
              <div key={item.id} className="space-y-[6px]">
                <button
                  className={`flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden ${isDark ? "bg-[#d9d9d9] hover:bg-[#959595]" : "bg-[#f5f5f5] hover:bg-[#e0e0e0]"} transition`}
                  onClick={() => setSelectedItem(item)}
                  onMouseEnter={() => setShowTooltip(item)}
                  onMouseLeave={() => setShowTooltip(null)}
                  onMouseMove={(e) =>
                    setMousePos({ x: e.clientX, y: e.clientY })
                  }
                >
                  <div className="flex items-center justify-center text-2xl text-black">
                    {item.image_cover_url ? (
                      <Image
                        src={item.image_cover_url}
                        alt={item.name}
                        width={50}
                        height={50}
                        unoptimized
                      />
                    ) : (
                      <QuestionIcon />
                    )}
                  </div>
                </button>

                <div className="flex w-16 items-center justify-between">
                  <ManaIcon width={16} height={16} />
                  <div
                    className={`text-xs ${isDark ? "text-white" : "text-black"}`}
                  >
                    {item.mana_required}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      {showTooltip && (
        <SlotTooltip
          title={showTooltip.name || ""}
          description={[
            `Mana Rate: ${showTooltip.mana_rate}/m`,
            "Click To Purchase",
          ]}
          x={mousePos.x}
          y={mousePos.y}
        />
      )}
    </>
  );
};

interface StoreContentProps {
  profile: ProfileType;
  onUpdateMana: (newMana: number) => void;
}

const StoreContent = ({ profile, onUpdateMana }: StoreContentProps) => {
  const { items, loading: itemsLoading } = useItems();
  const { purchaseItem } = useIslandItemsContext();
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { showToast } = useToast();
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

  const handlePurchase = async (itemId: string) => {
    setIsPurchasing(true);

    if (selectedItem && selectedItem.mana_required > profile.mana) {
      showToast("Not enough mana", "error");
      setIsPurchasing(false);
      return;
    }

    const manaCost = selectedItem?.mana_required || 0;
    const result = await purchaseItem(itemId, profile.id, manaCost);
    if (result.success) {
      showToast("Item purchased successfully!", "success");
      if (result.newMana !== undefined) {
        onUpdateMana(result.newMana);
      }
    } else {
      showToast("Failed to purchase item", "error");
    }
    setIsPurchasing(false);
    setSelectedItem(null);
  };

  if (itemsLoading) {
    return <LoadingScreen width="w-full" height="h-full" bgColor="inherit" />;
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <ScrollArea className="h-[430px] w-full">
        <div className="flex items-center justify-center">
          <div className="w-fit space-y-10 p-10">
            <StoreRow
              items={items}
              category="Functional"
              icon={<FileIcon />}
              setSelectedItem={setSelectedItem}
            />
            <StoreRow
              items={items}
              category="Decorative"
              icon={<SeedlingIcon />}
              setSelectedItem={setSelectedItem}
            />
            <StoreRow
              items={items}
              category="Terrain"
              icon={<BlockIcon />}
              setSelectedItem={setSelectedItem}
            />
          </div>
        </div>
      </ScrollArea>

      {selectedItem && (
        <div className="fixed left-0 top-0 flex h-screen w-screen items-center justify-center bg-black bg-opacity-25">
          <Dialog
            iconStyle="bg-[#6d3f33] text-white"
            icon={<ExclaimationIcon />}
            title="Purchase item?"
            size="small"
            setIsDialogOpen={() => setSelectedItem(null)}
            borderColor="border-[#d9d9d9]"
            className="flex items-center justify-center"
          >
            <div className="space-y-6">
              <p className="text-center">
                <span
                  className={isDark ? "text-neutral-300" : "text-neutral-600"}
                >
                  Are you sure you want to purchase
                </span>
                <br />
                <span
                  className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}
                >
                  {selectedItem.name}
                </span>
                <br />
                <span
                  className={isDark ? "text-neutral-300" : "text-neutral-600"}
                >
                  ?
                </span>
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  className={`border border-transparent ${isDark ? "bg-[#333333]" : "bg-[#f5f5f5]"} transition hover:border-[#515151] disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-white" : "text-black"}`}
                  onClick={() => handlePurchase(selectedItem.id)}
                  disabled={isPurchasing}
                >
                  Yes
                </Button>
                <Button
                  className={`border border-transparent ${isDark ? "bg-[#1a1a1a]" : "bg-[#e0e0e0]"} transition hover:border-[#515151] disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-white" : "text-black"}`}
                  onClick={() => setSelectedItem(null)}
                  disabled={isPurchasing}
                >
                  No
                </Button>
              </div>
            </div>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default StoreContent;
