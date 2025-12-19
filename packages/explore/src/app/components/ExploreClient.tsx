"use client";

import { useEffect, useState } from "react";
import ExploreCard from "./ExploreCard";

const ExploreClient = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // fetch results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedSearch)}`
        );
        const json = await res.json();
        setResults(json.data || []);
      } catch (e) {
        console.error("Search failed", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (debouncedSearch.trim()) fetchResults();
    else setResults([]);
  }, [debouncedSearch]);

  return (
    <>
      {/* Search Bar + Filters */}
      <div className="flex items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-2xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for knowledge"
            className="w-full rounded-full bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>

        {/* Category / Sort (占位，逻辑未启用) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-gray-300 opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            ⛃ Category Filter
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-gray-300 opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            ⇅ Sort By
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mb-6 text-sm text-gray-400 animate-pulse">
          Searching knowledge base…
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {results.length > 0 ? (
          results.map((item) => (
            <ExploreCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.content}
              lastUpdatedBy={
                item.updated_at
                  ? new Date(item.updated_at).toLocaleDateString()
                  : "No data"
              }
            />
          ))
        ) : (
          !loading && (
            <div className="col-span-full text-center text-gray-400 py-12">
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1 opacity-70">
                Try different keywords or explore new topics
              </p>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default ExploreClient;
