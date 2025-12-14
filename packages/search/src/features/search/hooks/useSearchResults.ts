"use client";

import { useState, useEffect } from "react";
import { SearchResult } from "@/types/types";

export function useSearchResults(initialResults: SearchResult[] = []) {
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    setResults(initialResults);
  }, [initialResults]);

  const selectResult = (result: SearchResult) => {
    setSelectedResult(result);
  };

  const clearSelection = () => {
    setSelectedResult(null);
  };

  return {
    results,
    selectedResult,
    selectResult,
    clearSelection,
  };
}
