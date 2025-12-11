"use client";

import { useState, useCallback } from "react";
import { CloudWord } from "@/types/types";
import { filterCloudWords } from "@/utils/cloudUtils";

/**
 * Hook for managing cloud search state and filtering
 */
export function useCloudSearch(initialWords: CloudWord[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [filteredWords, setFilteredWords] = useState(initialWords);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const query = searchQuery.trim();
      setActiveSearch(query);
      setFilteredWords(filterCloudWords(initialWords, query));
    },
    [searchQuery, initialWords]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveSearch("");
    setFilteredWords(initialWords);
  }, [initialWords]);

  const updateSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return {
    searchQuery,
    activeSearch,
    filteredWords,
    handleSearch,
    handleClearSearch,
    updateSearchQuery,
    matchCount: filteredWords.length,
  };
}
