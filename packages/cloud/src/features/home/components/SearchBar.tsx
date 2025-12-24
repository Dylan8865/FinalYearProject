"use client";

import React from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchBar Component - Reusable search input
 */
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search...",
  className = "",
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className={`relative ${className}`}>
      <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-6 py-4 shadow-2xl">
        <svg
          className="w-5 h-5 text-gray-400 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="ml-2 absolute right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
