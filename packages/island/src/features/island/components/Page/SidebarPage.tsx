"use client";

import PageControls from "./PageControls";
import { useEffect, useMemo, useCallback } from "react";
import { useIslandItemsContext } from "../../contexts/IslandItemsContext";
import { useItemData } from "../../hooks/useItemData";
import { BlockType, BlockProperties } from "@/types/types";
import PageContent from "./PageContent";

interface SidebarPageProps {
  isOpen?: boolean;
  itemId?: string;
  itemName?: string;
  onClick?: () => void;
}

const onExpand = () => {
  console.log("handle onExpand"); // TODO: implement onExpand
};

const SidebarPage = ({
  isOpen,
  itemId,
  itemName,
  onClick,
}: SidebarPageProps) => {
  const { islandItems } = useIslandItemsContext();

  const islandItem = useMemo(() => {
    if (!itemId || itemId.length === 0) return null;
    return islandItems.find((item) => item.id === itemId) ?? null;
  }, [islandItems, itemId]);

  const {
    data: itemData,
    loading,
    error,
    refetch,
  } = useItemData(islandItem?.id);

  useEffect(() => {
    console.log("itemData", itemData);
  }, [itemData]);

  // Handle block updates
  const handleUpdateBlock = useCallback(
    async (id: string, content: any, properties?: BlockProperties) => {
      try {
        const response = await fetch("/api/item-data", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            content,
            properties,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update block");
        }

        // Optimistically update the UI
        refetch();
      } catch (error) {
        console.error("Error updating block:", error);
      }
    },
    [refetch]
  );

  // Handle block deletion
  const handleDeleteBlock = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/item-data?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete block");
        }

        // Optimistically update the UI
        refetch();
      } catch (error) {
        console.error("Error deleting block:", error);
      }
    },
    [refetch]
  );

  // Handle adding new blocks
  const handleAddBlock = useCallback(
    async (afterId: string, type: BlockType) => {
      if (!islandItem?.id) return;

      try {
        // Find the order_index of the block after which we're inserting
        const afterBlock = itemData?.find((block) => block.id === afterId);
        const newOrderIndex = afterBlock
          ? (afterBlock.order_index || 0) + 1
          : itemData?.length || 0;

        const response = await fetch("/api/item-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            island_item_id: islandItem.id,
            type,
            content: "",
            properties: {},
            order_index: newOrderIndex,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add block");
        }

        // Optimistically update the UI
        refetch();
      } catch (error) {
        console.error("Error adding block:", error);
      }
    },
    [islandItem, itemData, refetch]
  );

  if (loading) {
    return (
      <div
        className="absolute right-0 top-0 z-50 flex h-full w-4/5 items-center justify-center bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="absolute right-0 top-0 z-50 flex h-full w-4/5 items-center justify-center bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      className="absolute right-0 top-0 z-50 h-full w-4/5 overflow-y-auto bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
      style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
    >
      <PageControls onClick={onClick} onExpand={onExpand} />
      <PageContent
        islandItem={islandItem}
        itemData={itemData}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        onAddBlock={handleAddBlock}
      />
    </div>
  );
};

export default SidebarPage;
