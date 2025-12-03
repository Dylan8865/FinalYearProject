"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchResult, SearchFilters } from "@/types/types";

const defaultFilters: SearchFilters = {
  category: "all",
  sortBy: "relevance",
};

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const search = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        category: searchFilters.category,
        sortBy: searchFilters.sortBy,
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      search(query, filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, filters, search]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    filters,
    setFilters,
  };
}
