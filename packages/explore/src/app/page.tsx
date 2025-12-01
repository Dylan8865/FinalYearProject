"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Island Icon Component
const IslandIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C8 2 5 5 5 9C5 13 8 15 12 15C16 15 19 13 19 9C19 5 16 2 12 2Z"
      fill="currentColor"
      opacity="0.6"
    />
    <path
      d="M3 18C3 18 6 16 12 16C18 16 21 18 21 18C21 20 18 22 12 22C6 22 3 20 3 18Z"
      fill="currentColor"
    />
    <path d="M12 8V13M10 10L12 8L14 10" stroke="white" strokeWidth="1.5" />
  </svg>
);

// Mock content data - will be replaced with database
const MOCK_CONTENT = [
  { id: 1, title: "Lorem ipsum", type: "read", duration: "2m read", category: "technology", date: "2025-11-28" },
  { id: 2, title: "Lorem ipsum", type: "watch", duration: "2m watch", category: "design", date: "2025-11-27" },
  { id: 3, title: "Lorem ipsum", type: "read", duration: "3m read", category: "business", date: "2025-11-26" },
  { id: 4, title: "Lorem ipsum", type: "watch", duration: "5m watch", category: "technology", date: "2025-11-25" },
  { id: 5, title: "Lorem ipsum", type: "read", duration: "2m read", category: "science", date: "2025-11-24" },
  { id: 6, title: "Lorem ipsum", type: "read", duration: "4m read", category: "design", date: "2025-11-23" },
  { id: 7, title: "Lorem ipsum", type: "watch", duration: "3m watch", category: "business", date: "2025-11-22" },
  { id: 8, title: "Lorem ipsum", type: "read", duration: "2m read", category: "technology", date: "2025-11-21" },
  { id: 9, title: "Lorem ipsum", type: "read", duration: "6m read", category: "science", date: "2025-11-20" },
  { id: 10, title: "Lorem ipsum", type: "watch", duration: "4m watch", category: "design", date: "2025-11-19" },
  { id: 11, title: "Lorem ipsum", type: "read", duration: "2m read", category: "business", date: "2025-11-18" },
  { id: 12, title: "Lorem ipsum", type: "read", duration: "3m read", category: "technology", date: "2025-11-17" },
];

const CATEGORIES = ["all", "technology", "design", "business", "science"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "duration-asc", label: "Duration (Ascending)" },
  { value: "duration-desc", label: "Duration (Descending)" },
];

function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [isSearching, setIsSearching] = useState(!!queryParam);
  const [content, setContent] = useState(MOCK_CONTENT);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter and sort content
  useEffect(() => {
    let filtered = [...MOCK_CONTENT];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Sort content
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "title-asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "duration-asc":
        filtered.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
        break;
      case "duration-desc":
        filtered.sort((a, b) => parseInt(b.duration) - parseInt(a.duration));
        break;
    }

    setContent(filtered);
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
      setIsSearching(true);
      // Filter content based on search (mock filtering)
      setContent(MOCK_CONTENT);
    }
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      router.push(`/?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setIsSearching(false);
      router.push("/");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!e.target.value.trim()) {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-8">
          {/* Island Icon - Links to Island Game Page */}
          <a
            href="http://localhost:3004"
            className="text-white hover:text-gray-300 transition-colors"
          >
            <IslandIcon />
          </a>

          <nav className="flex gap-6">
            <a
              href="http://localhost:3003"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Home
            </a>
            <a
              href="http://localhost:3002"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Cloud
            </a>
            <button className="text-white font-medium border-b-2 border-white">
              Search
            </button>
          </nav>
        </div>

        <a
          href="http://localhost:3001/login"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Sign in
        </a>
      </header>

      {/* Search and Filters */}
      <div className="px-8 py-4">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="flex items-center bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
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
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search for knowledge"
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
              />
            </div>
          </form>

          {/* Category Filter Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowSortDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="capitalize">
                {selectedCategory === "all" ? "Category Filter" : selectedCategory}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Category Dropdown */}
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 capitalize hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedCategory === category ? "bg-gray-700 text-blue-400" : "text-white"
                    }`}
                  >
                    {category === "all" ? "All Categories" : category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort By Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowCategoryDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
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
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              <span>{SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || "Sort By"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Sort Dropdown */}
            {showSortDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      sortBy === option.value ? "bg-gray-700 text-blue-400" : "text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-8 py-4">
        <h2 className="text-lg font-semibold">
          {isSearching
            ? `${content.length} matching results`
            : "Recently added"}
        </h2>
      </div>

      {/* Content Grid */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {content.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer"
              onClick={() => router.push(`/${item.id}`)}
            >
              {/* Card Image Placeholder */}
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-gradient-to-b from-sky-300 to-sky-400">
                {/* Image will be loaded from database */}
              </div>

              {/* Card Info */}
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">{item.title}</h3>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2 mt-1 text-gray-400 text-sm">
                {item.type === "read" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <span>{item.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>}>
      <SearchPage />
    </Suspense>
  );
}
