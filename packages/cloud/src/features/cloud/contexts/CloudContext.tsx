"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useTopics, CloudTopic } from "@/features/cloud/hooks/useTopics";
import { CloudWord3D } from "@/features/cloud/components/TagCanvas3D";

interface CloudContextType {
  // Topics state (AI-extracted from item-data)
  topics: CloudTopic[];
  words: CloudWord3D[];
  loading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  incrementClickCount: (id: string) => void;
}

const CloudContext = createContext<CloudContextType | undefined>(undefined);

interface CloudProviderProps {
  children: ReactNode;
}

/**
 * CloudProvider
 * 
 * Provides AI-extracted topics from item-data to the CloudPage
 * Data flow: item-data (Supabase) → AI (Gemini) → CloudContext → TagCanvas3D
 */
export function CloudProvider({ children }: CloudProviderProps) {
  const topicsData = useTopics();

  return (
    <CloudContext.Provider value={topicsData}>{children}</CloudContext.Provider>
  );
}

export function useCloudContext() {
  const context = useContext(CloudContext);
  if (context === undefined) {
    throw new Error("useCloudContext must be used within CloudProvider");
  }
  return context;
}
