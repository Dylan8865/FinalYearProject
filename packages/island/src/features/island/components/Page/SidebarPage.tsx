"use client";

import PageControls from "./PageControls";
import PageHeader from "./PageHeader";
import { useEffect, useMemo } from "react";
import { useIslandItemsContext } from "../../contexts/IslandItemsContext";
import { useItemData } from "../../hooks/useItemData";
import { BlockEditorContainer } from "../block-system";

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

  if (loading) {
    return (
      <div
        className="absolute right-0 top-0 z-50 flex h-full w-4/5 items-center justify-center bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Loading skeleton */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
          <div className="text-sm text-gray-500">Loading blocks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="absolute right-0 top-0 z-50 flex h-full w-4/5 flex-col items-center justify-center bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="text-red-400">Error: {error}</div>
          <button
            onClick={refetch}
            className="mt-2 rounded-md bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute right-0 top-0 z-50 h-full w-4/5 overflow-y-auto bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
      style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
    >
      <PageControls onClick={onClick} onExpand={onExpand} />

      {/* Page Header */}
      <PageHeader islandItem={islandItem} />

      {/* Block Editor */}
      {islandItem && (
        <BlockEditorContainer
          islandItemId={islandItem.id}
          initialBlocks={itemData || []}
          onRefetch={refetch}
        />
      )}
    </div>
  );
};

export default SidebarPage;
