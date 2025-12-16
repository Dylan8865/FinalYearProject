"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { calculateIslandTotalManaRate } from "@/utils/manaCalculations";
import { IslandItemType } from "@/types/types";

interface IslandManaState {
  manaRate: number;
  accumulatedMana: number;
}

interface ManaContextType {
  // Per-island mana state
  islandManaStates: Record<string, IslandManaState>;
  setIslandManaStates: React.Dispatch<
    React.SetStateAction<Record<string, IslandManaState>>
  >;

  // User's total mana balance
  totalMana: number;
  setTotalMana: (mana: number) => void;

  // Calculate mana rate for an island
  calculateManaRate: (
    islandId: string,
    islandLevel: number,
    placedItems: IslandItemType[]
  ) => number;

  // Get accumulated mana for an island
  getAccumulatedMana: (islandId: string) => number;

  // Check if island has collectible mana
  hasCollectibleMana: (islandId: string) => boolean;
}

const ManaContext = createContext<ManaContextType | undefined>(undefined);

interface ManaProviderProps {
  children: ReactNode;
  initialMana: number;
  profileId: string;
}

// Minimum mana threshold to show as collectible
const MIN_COLLECTIBLE_MANA = 500;

export function ManaProvider({ children, initialMana }: ManaProviderProps) {
  const [totalMana, setTotalMana] = useState(initialMana);
  const [islandManaStates, setIslandManaStates] = useState<
    Record<string, IslandManaState>
  >({});

  const calculateManaRate = useCallback(
    (
      islandId: string,
      islandLevel: number,
      placedItems: IslandItemType[]
    ): number => {
      return calculateIslandTotalManaRate(
        { id: islandId, level: islandLevel },
        placedItems
      );
    },
    []
  );

  const getAccumulatedMana = useCallback(
    (islandId: string): number => {
      return islandManaStates[islandId]?.accumulatedMana || 0;
    },
    [islandManaStates]
  );

  const hasCollectibleMana = useCallback(
    (islandId: string): boolean => {
      const accumulated = islandManaStates[islandId]?.accumulatedMana || 0;
      return accumulated >= MIN_COLLECTIBLE_MANA;
    },
    [islandManaStates]
  );

  return (
    <ManaContext.Provider
      value={{
        islandManaStates,
        setIslandManaStates,
        totalMana,
        setTotalMana,
        calculateManaRate,
        getAccumulatedMana,
        hasCollectibleMana,
      }}
    >
      {children}
    </ManaContext.Provider>
  );
}

export function useManaContext() {
  const context = useContext(ManaContext);
  if (context === undefined) {
    throw new Error("useManaContext must be used within ManaProvider");
  }
  return context;
}
