"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { calculateIslandTotalManaRate } from "@/utils/manaCalculations";
import { IslandItemType } from "@/types/types";

interface IslandManaState {
  manaRate: number;
  accumulatedMana: number;
  lastCollectionTime: Date;
}

interface ManaContextType {
  // Per-island mana state
  islandManaStates: Record<string, IslandManaState>;

  // User's total mana balance
  totalMana: number;

  // Update total mana (from profile updates)
  setTotalMana: (mana: number) => void;

  // Calculate mana rate for an island
  calculateManaRate: (
    islandId: string,
    islandLevel: number,
    placedItems: IslandItemType[]
  ) => number;

  // Get accumulated mana for an island
  getAccumulatedMana: (islandId: string) => number;

  // Collect mana from an island
  collectMana: (islandId: string) => Promise<{
    collected: number;
    newMana: number;
  }>;

  // Check if island has collectible mana
  hasCollectibleMana: (islandId: string) => boolean;

  // Initialize island mana tracking
  initializeIsland: (
    islandId: string,
    islandLevel: number,
    placedItems: IslandItemType[]
  ) => void;

  // Update island placed items (recalculates mana rate)
  updateIslandItems: (
    islandId: string,
    islandLevel: number,
    placedItems: IslandItemType[]
  ) => void;
}

const ManaContext = createContext<ManaContextType | undefined>(undefined);

interface ManaProviderProps {
  children: ReactNode;
  initialMana: number;
  profileId: string;
}

// Minimum mana threshold to show as collectible
const MIN_COLLECTIBLE_MANA = 1;

export function ManaProvider({
  children,
  initialMana,
  profileId,
}: ManaProviderProps) {
  const [totalMana, setTotalMana] = useState(initialMana);
  const [islandManaStates, setIslandManaStates] = useState<
    Record<string, IslandManaState>
  >({});

  // Update accumulated mana every second
  useEffect(() => {
    const interval = setInterval(() => {
      setIslandManaStates((prev) => {
        const now = new Date();
        const updated: Record<string, IslandManaState> = {};

        Object.entries(prev).forEach(([islandId, state]) => {
          const elapsedSeconds =
            (now.getTime() - state.lastCollectionTime.getTime()) / 1000;
          const accumulated = Math.floor(state.manaRate * elapsedSeconds);

          updated[islandId] = {
            ...state,
            accumulatedMana: accumulated,
          };
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initializeIsland = useCallback(
    (
      islandId: string,
      islandLevel: number,
      placedItems: IslandItemType[]
    ) => {
      const manaRate = calculateIslandTotalManaRate(
        { id: islandId, level: islandLevel },
        placedItems
      );

      setIslandManaStates((prev) => {
        // Don't reinitialize if already exists
        if (prev[islandId]) {
          return prev;
        }

        return {
          ...prev,
          [islandId]: {
            manaRate,
            accumulatedMana: 0,
            lastCollectionTime: new Date(),
          },
        };
      });
    },
    []
  );

  const updateIslandItems = useCallback(
    (
      islandId: string,
      islandLevel: number,
      placedItems: IslandItemType[]
    ) => {
      const manaRate = calculateIslandTotalManaRate(
        { id: islandId, level: islandLevel },
        placedItems
      );

      setIslandManaStates((prev) => {
        const existing = prev[islandId];
        if (!existing) {
          return {
            ...prev,
            [islandId]: {
              manaRate,
              accumulatedMana: 0,
              lastCollectionTime: new Date(),
            },
          };
        }

        return {
          ...prev,
          [islandId]: {
            ...existing,
            manaRate,
          },
        };
      });
    },
    []
  );

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

  const collectMana = useCallback(
    async (
      islandId: string
    ): Promise<{ collected: number; newMana: number }> => {
      const state = islandManaStates[islandId];
      if (!state) {
        return { collected: 0, newMana: totalMana };
      }

      try {
        const response = await fetch("/api/islands/collect-mana", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            island_id: islandId,
            last_collection_time: state.lastCollectionTime.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to collect mana");
        }

        const data = await response.json();

        // Update local state
        setTotalMana(data.new_mana);
        setIslandManaStates((prev) => ({
          ...prev,
          [islandId]: {
            ...prev[islandId],
            accumulatedMana: 0,
            lastCollectionTime: new Date(data.collection_time),
          },
        }));

        return {
          collected: data.collected,
          newMana: data.new_mana,
        };
      } catch (err) {
        console.error("Failed to collect mana:", err);
        return { collected: 0, newMana: totalMana };
      }
    },
    [islandManaStates, totalMana]
  );

  return (
    <ManaContext.Provider
      value={{
        islandManaStates,
        totalMana,
        setTotalMana,
        calculateManaRate,
        getAccumulatedMana,
        collectMana,
        hasCollectibleMana,
        initializeIsland,
        updateIslandItems,
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
