"use client";

import { SearchFilters as Filters } from "@/types/types";

interface SearchFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function SearchFilters({ filters, setFilters }: SearchFiltersProps) {
  const categories = ["All", "Islands", "Items", "Users"];

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">Filters</h3>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700">Category</h4>
        <div className="mt-2 space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-2">
              <input
                type="radio"
                name="category"
                value={category.toLowerCase()}
                checked={filters.category === category.toLowerCase()}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="text-blue-600"
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700">Sort by</h4>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="mt-2 w-full rounded border px-3 py-2 text-sm"
        >
          <option value="relevance">Relevance</option>
          <option value="date">Date</option>
          <option value="name">Name</option>
        </select>
      </div>
    </div>
  );
}
