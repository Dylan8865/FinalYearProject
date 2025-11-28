import React from "react";
import { useItems } from "../../hooks/useItems";
import { useIslandItems } from "../../hooks/useIslandItems";

interface StoreContentProps {
  userId: string;
}

const StoreContent = ({ userId }: StoreContentProps) => {
  const { items, loading: itemsLoading } = useItems();
  const { purchaseItem } = useIslandItems(userId);

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
    <div className="grid grid-cols-3 gap-4 overflow-auto max-h-[400px]">
      {items.map((item) => (
        <div
          key={item.id}
          className="border-4 border-white p-4 bg-[#333333] hover:bg-[#444444] transition"
        >
          <div className="text-xl font-bold mb-2">{item.name}</div>
          <div className="text-sm mb-2">Type: {item.type}</div>
          <div className="text-sm mb-2">Oxygen Rate: {item.oxygen_rate}/hr</div>
          <div className="text-yellow-400 mb-3">
            Cost: {item.oxygen_required} 💧
          </div>
          <button
            onClick={() => handlePurchase(item.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 border-2 border-white"
          >
            Purchase
          </button>
        </div>
      ))}
    </div>
  );
};

export default StoreContent;
