"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useTopics, CloudTopic } from "@/features/home/hooks/useTopics";
import { CloudWord3D } from "@/features/home/components/TagCanvas3D";

interface HomeContextType {
  // Topics state (AI-extracted from item-data)
  topics: CloudTopic[];
  words: CloudWord3D[];
  loading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  incrementClickCount: (id: string) => void;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

interface HomeProviderProps {
  children: ReactNode;
}

/**
 * HomeProvider
 *
 * Provides AI-extracted topics from item-data to the CloudPage
 * Data flow: item-data (Supabase) → AI (Gemini) → HomeContext → TagCanvas3D
 */
export function HomeProvider({ children }: HomeProviderProps) {
  const topicsData = useTopics();

  return (
    <HomeContext.Provider value={topicsData}>{children}</HomeContext.Provider>
  );
}

export function useHomeContext() {
  const context = useContext(HomeContext);
  if (context === undefined) {
    throw new Error("useHomeContext must be used within HomeProvider");
  }
  return context;
}
