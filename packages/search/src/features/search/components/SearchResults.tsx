"use client";

import ResultCard from "./ResultCard";
import { SearchResult } from "@/types/types";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
}

export default function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No results found. Try a different search term.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{results.length} results found</p>
      {results.map((result) => (
        <ResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}
