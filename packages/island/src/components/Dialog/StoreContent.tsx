"use client";
/* eslint-disable react-hooks/purity */
import React, { useState } from "react";
import { useItems } from "../../hooks/useItems";
import { useIslandItems } from "../../hooks/useIslandItems";
import FileIcon from "../../icons/FileIcon";
import { ItemType } from "../../types";
import SeedlingIcon from "../../icons/SeedlingIcon";
import BlockIcon from "../../icons/BlockIcon";
import OxygenIcon from "../../icons/OxygenIcon";
import { ScrollArea } from "../ui/ScrollArea";
import QuestionIcon from "../../icons/QuestionIcon";
import Dialog from "./Dialog";
import ExclaimationIcon from "../../icons/ExclaimationIcon";
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
                className="flex justify-center items-center h-16 w-16 overflow-hidden bg-[#d9d9d9] hover:bg-[#959595] transition cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="text-black flex justify-center items-center text-2xl">
                  <QuestionIcon />
                </div>
              </button>

              <div className="flex justify-between items-center w-16">
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

  const handlePurchase = async (itemId: string) => {
    const success = await purchaseItem(itemId, userId);
    if (success) {
      alert("Item purchased successfully!");
    } else {
      alert("Failed to purchase item");
    }
  };

  if (itemsLoading) {
    return <div className="text-center">Loading items...</div>;
  }

  return (
    <div className="relative flex justify-center items-center flex-col h-full w-full">
      <ScrollArea className="h-[430px] w-full">
        <div className="flex justify-center items-center">
          <div className="p-10 space-y-10 w-fit">
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
        <div className="fixed h-screen w-screen top-0 left-0 flex justify-center items-center bg-black bg-opacity-25">
          <Dialog
            iconStyle="bg-[#6d3f33] text-white"
            icon={<ExclaimationIcon />}
            title="Purchase item?"
            size="small"
            setIsDialogOpen={setSelectedItem}
            borderColor="border-[#d9d9d9]"
            className="flex justify-center items-center"
          >
            <div className="space-y-6">
              <p className="text-center">
                <span className="text-neutral-300">
                  Are you sure you want to purchase
                </span>
                <br />
                <span className="font-bold text-lg">{selectedItem.name}</span>
                <br />
                <span className="text-neutral-300">?</span>
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  className="bg-[#333333] border border-transparent hover:border-[#515151] transition"
                  onClick={() => handlePurchase(selectedItem.id)}
                >
                  Yes
                </Button>
                <Button
                  className="bg-[#1a1a1a] border border-transparent hover:border-[#515151] transition"
                  onClick={() => setSelectedItem(null)}
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
