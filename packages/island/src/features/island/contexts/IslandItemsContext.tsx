"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useIslandItems } from "@/features/island/hooks/useIslandItems";
import { IslandItemType } from "@/types/types";

interface IslandItemsContextType {
  islandItems: IslandItemType[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  purchaseItem: (itemId: string, profileId: string, remainingMana: number) => Promise<boolean>;
  placeItemOnIsland: (
    islandItemId: string,
    islandId: string,
    gridX: number,
    gridY: number,
    gridZ: number
  ) => Promise<boolean>;
  updateItemPosition: (
    islandItemId: string,
    posX: number,
    posY: number
  ) => Promise<boolean>;
  deleteItem: (islandItemId: string) => Promise<boolean>;
  removeItemFromIsland: (islandItemId: string, profileId: string) => Promise<boolean>;
  moveToInventory: (islandItemId: string, slotX: number, slotY: number) => Promise<boolean>;
}

const IslandItemsContext = createContext<IslandItemsContextType | undefined>(
  undefined
);

interface IslandItemsProviderProps {
  children: ReactNode;
  profileId: string;
  islandId?: string;
}

export function IslandItemsProvider({
  children,
  profileId,
  islandId,
}: IslandItemsProviderProps) {
  const islandItemsData = useIslandItems(profileId, islandId);

  return (
    <IslandItemsContext.Provider value={islandItemsData}>
      {children}
    </IslandItemsContext.Provider>
  );
}

export function useIslandItemsContext() {
  const context = useContext(IslandItemsContext);
  if (context === undefined) {
    throw new Error(
      "useIslandItemsContext must be used within IslandItemsProvider"
    );
  }
  return context;
}
