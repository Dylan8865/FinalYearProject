/* eslint-disable react-hooks/purity */
import React from "react";
import { useItems } from "../../hooks/useItems";
import { useIslandItems } from "../../hooks/useIslandItems";
import FileIcon from "../../icons/FileIcon";
import { ItemType } from "@/types/types";
import SeedlingIcon from "../../icons/SeedlingIcon";
import BlockIcon from "../../icons/BlockIcon";
import OxygenIcon from "../../icons/OxygenIcon";
import { ScrollArea } from "@/components/ui/ScrollArea";

interface StoreRowProps {
  items: ItemType[];
  category: string;
  icon: React.ReactNode;
}

const StoreRow = ({ items, category, icon }: StoreRowProps) => {
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
              <div className="flex justify-center items-center h-16 w-16 overflow-hidden bg-[#d9d9d9] hover:bg-[#444444] transition cursor-pointer">
                <div className="text-black text-center text-xs">?</div>
              </div>

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

  const mockItems: ItemType[] = Array.from({ length: 60 }, (_, i) => {
    const types = ["functional", "decorative", "terrain"];
    const names = [
      "Oxygen Tank",
      "Fishing Rod",
      "Decorative Plant",
      "Beach Chair",
      "Speed Booster",
      "Sun Umbrella",
      "Treasure Map",
      "Lantern",
      "Water Purifier",
      "Garden Gnome",
    ];

    return {
      id: `item-${i + 1}`,
      created_at: new Date().toISOString(),
      name: names[i % names.length],
      oxygen_rate: Math.floor(Math.random() * 20) + 1,
      type: types[Math.floor(i / 20)],
      oxygen_required: Math.floor(Math.random() * 100) + 50,
    };
  });

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
    <ScrollArea className="h-[430px] w-full">
      <div className="flex justify-center items-center">
        <div className="p-10 space-y-10 w-fit">
          <StoreRow
            items={mockItems}
            category="Functional"
            icon={<FileIcon />}
          />
          <StoreRow
            items={mockItems}
            category="Decorative"
            icon={<SeedlingIcon />}
          />
          <StoreRow items={mockItems} category="Terrain" icon={<BlockIcon />} />
        </div>
      </div>
    </ScrollArea>
  );
};

export default StoreContent;
