"use client";
/* eslint-disable react-hooks/purity */
import React, { useState } from "react";
import { useItems } from "@/features/island/hooks/useItems";
import { useIslandItems } from "@/features/island/hooks/useIslandItems";
import FileIcon from "@/icons/FileIcon";
import { ItemType } from "@/types/types";
import SeedlingIcon from "@/icons/SeedlingIcon";
import BlockIcon from "@/icons/BlockIcon";
import OxygenIcon from "@/icons/OxygenIcon";
import { ScrollArea } from "@/features/island/components/Dialog/ScrollArea";
import QuestionIcon from "@/icons/QuestionIcon";
import Dialog from "./Dialog";
import ExclaimationIcon from "@/icons/ExclaimationIcon";
import Button from "./Button";

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
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-lg">
        {icon}
        <h1>{category}</h1>
      </div>
      <div className="grid grid-cols-10 gap-4">
        {items
          .filter((item) => item.type === category.toLowerCase())
          .map((item) => (
            <div key={item.id} className="space-y-[6px]">
              <button
                className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden bg-[#d9d9d9] transition hover:bg-[#959595]"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-center justify-center text-2xl text-black">
                  <QuestionIcon />
                </div>
              </button>

              <div className="flex w-16 items-center justify-between">
                <OxygenIcon width={16} height={16} />
                <div className="text-xs">{item.oxygen_required}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

interface StoreContentProps {
  userId: string;
}

const StoreContent = ({ userId }: StoreContentProps) => {
  const { items, loading: itemsLoading } = useItems();
  const { purchaseItem } = useIslandItems(userId);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (itemId: string) => {
    setIsPurchasing(true);
    const success = await purchaseItem(itemId, userId);
    if (success) {
      alert("Item purchased successfully!");
    } else {
      alert("Failed to purchase item");
    }
    setIsPurchasing(false);
    setSelectedItem(null);
  };

  if (itemsLoading) {
    return <div className="text-center">Loading items...</div>;
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
            setIsDialogOpen={setSelectedItem}
            borderColor="border-[#d9d9d9]"
            className="flex items-center justify-center"
          >
            <div className="space-y-6">
              <p className="text-center">
                <span className="text-neutral-300">
                  Are you sure you want to purchase
                </span>
                <br />
                <span className="text-lg font-bold">{selectedItem.name}</span>
                <br />
                <span className="text-neutral-300">?</span>
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  className="border border-transparent bg-[#333333] transition hover:border-[#515151] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handlePurchase(selectedItem.id)}
                  disabled={isPurchasing}
                >
                  Yes
                </Button>
                <Button
                  className="border border-transparent bg-[#1a1a1a] transition hover:border-[#515151] disabled:cursor-not-allowed disabled:opacity-50"
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
