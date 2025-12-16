"use client";

import React, { useMemo, useState } from "react";
import ExploreCard from "./ExploreCard";

type World = {
  id: string;
  title: string;
  description: string;
};

const ExploreClient = ({ worlds }: { worlds: World[] }) => {
  const [search, setSearch] = useState("");

  const filteredWorlds = useMemo(() => {
    const q = search.toLowerCase();
    return worlds.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q)
    );
  }, [search, worlds]);

  return (
    <>
      {/* Search bar（UI 完全一样） */}
      <div className="max-w-3xl mb-6">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-60"
            >
              <path
                d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for knowledge"
            className="w-full bg-white/6 border border-white/8 rounded-full py-3 pl-12 pr-4 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>
      </div>

      {/* Filter & Sort（仍然只是 UI） */}
      <div className="flex gap-4 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-white/6 border border-white/8 rounded-full hover:bg-white/10">
          <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80">
            <path
              d="M4 6h16M7 12h10M10 18h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Category Filter
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-white/6 border border-white/8 rounded-full hover:bg-white/10">
          <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Sort By
        </button>
      </div>

      {/* Section Title */}
      <h2 className="text-lg font-semibold mb-4">Recently added</h2>

      {/* Card Grid（唯一改变：filteredWorlds） */}
      <div className="grid grid-cols-4 gap-6">
        {filteredWorlds.map((world) => (
          <ExploreCard
            key={world.id}
            id={world.id}
            title={world.title}
            description={world.description}
          />
        ))}
      </div>

      {filteredWorlds.length === 0 && (
        <p className="text-gray-400 mt-10">No results found.</p>
      )}
    </>
  );
};

export default ExploreClient;
