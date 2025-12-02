import React from "react";
import { useIslandItems } from "@/features/island/hooks/useIslandItems";

interface InventoryContentProps {
  userId: string;
}

const InventoryContent = ({ userId }: InventoryContentProps) => {
  const { islandItems, loading } = useIslandItems(userId);

  if (loading) {
    return <div className="text-center">Loading inventory...</div>;
  }

  // Separate placed and unplaced items
  const placedItems = islandItems.filter((item) => item.island_id !== null);
  const unplacedItems = islandItems.filter((item) => item.island_id === null);

  return (
    <div className="space-y-6 overflow-auto max-h-[400px]">
      {/* Unplaced Items */}
      <div>
        <h3 className="text-lg font-bold mb-3 border-b-2 border-white pb-2">
          Available Items ({unplacedItems.length})
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {unplacedItems.map((islandItem) => (
            <div
              key={islandItem.id}
              className="border-2 border-white p-3 bg-[#333333] hover:bg-[#444444] transition"
            >
              <div className="font-bold text-sm mb-1">
                {islandItem.item?.name}
              </div>
              <div className="text-xs text-gray-400">
                {islandItem.item?.type}
              </div>
            </div>
          ))}
        </div>
        {unplacedItems.length === 0 && (
          <div className="text-gray-400 text-center py-4">
            No items in inventory
          </div>
        )}
      </div>

      {/* Placed Items */}
      <div>
        <h3 className="text-lg font-bold mb-3 border-b-2 border-white pb-2">
          Placed Items ({placedItems.length})
        </h3>
        <div className="space-y-2">
          {placedItems.map((islandItem) => (
            <div
              key={islandItem.id}
              className="border-2 border-green-500 p-3 bg-[#2a2a2a] flex justify-between items-center"
            >
              <div>
                <div className="font-bold">{islandItem.item?.name}</div>
                <div className="text-xs text-gray-400">
                  Island: {islandItem.island?.name || "Unknown"}
                </div>
                <div className="text-xs text-gray-400">
                  Position: ({islandItem.grid_x}, {islandItem.grid_y},{" "}
                  {islandItem.grid_z})
                </div>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 text-sm border-2 border-white">
                Remove
              </button>
            </div>
          ))}
        </div>
        {placedItems.length === 0 && (
          <div className="text-gray-400 text-center py-4">
            No items placed on islands
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryContent;
