"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import IslandIcon from "@/icons/IslandIcon";
import MenuIcon from "@/icons/MenuIcon";
import CloseIcon from "@/icons/CloseIcon";
import CloudIcon from "@/icons/CloudIcon";
import ExploreIcon from "@/icons/ExploreIcon";
import { supabase } from "@/lib/supabase";

export default function Explore() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [isSearching, setIsSearching] = useState(!!queryParam);
  const [content, setContent] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch content
  useEffect(() => {
    async function fetchIslands() {
      setLoading(true);
      try {
        let query = supabase
          .from("island")
          .select("id, name, description, theme, created_at, last_updated_at, level");

        // Search filter
        if (queryParam) {
          query = query.ilike("name", `%${queryParam}%`);
        }

        // Category filter
        if (selectedCategory !== "all") {
          query = query.eq("theme", selectedCategory);
        }

        // Sorting
        switch (sortBy) {
          case "newest":
            query = query.order("created_at", { ascending: false });
            break;
          case "oldest":
            query = query.order("created_at", { ascending: true });
            break;
          case "title-asc":
            query = query.order("name", { ascending: true });
            break;
          case "title-desc":
            query = query.order("name", { ascending: false });
            break;
          // Duration sorts removed as we don't have duration usage yet
        }

        const { data, error } = await query.limit(20);

        if (error) throw error;
        setContent(data || []);
      } catch (err) {
        console.error("Error fetching islands:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchIslands();
  }, [queryParam, selectedCategory, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow empty search to "match all"
    setIsSearching(true);
    router.push(`/?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Determine searching state based on input presence? 
    // User wants "start searching" on enter even if empty.
  };

  const categories = ["spring", "summer", "autumn", "winter"]; // Derived from themes seen in screenshot

  return (
    <div className="h-screen overflow-y-auto bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-8">
          {/* Island Icon - Links to Island Game Page */}
          <button
            onClick={() => router.push("/mike/island")}
            className="text-white hover:text-gray-300 transition-colors transform scale-125 ml-2"
          >
            <IslandIcon />
          </button>

          <nav className="hidden md:flex gap-6">
            <button
              onClick={() => router.push("/home")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => router.push("/cloud")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Cloud
            </button>
            <button className="text-white font-medium border-b-2 border-white">
              Explore
            </button>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button - Moved to right */}
          <button
            className="md:hidden text-white transform scale-125 mr-2 p-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <MenuIcon />
          </button>

          {/* Sign in button removed as requested */}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm">
          <div className="flex flex-col h-full bg-[#1A1D1F] w-3/4 max-w-sm ml-auto shadow-2xl p-6">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="flex flex-col gap-6">
              <button
                onClick={() => router.push("/mike/island")}
                className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors text-lg"
              >
                <IslandIcon />
                <span>Island</span>
              </button>

              <button
                onClick={() => router.push("/cloud")}
                className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors text-lg"
              >
                <CloudIcon />
                <span>Cloud</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-4 text-white font-bold text-xl border-b-2 border-white w-fit pb-1"
              >
                <ExploreIcon />
                <span>Explore</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="px-8 py-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 w-full">
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
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none w-full"
              />
            </div>
          </form>

          {/* Filters Container */}
          <div className="flex gap-4 w-full md:w-auto">
            {/* Category Filter Button */}
            <div className="relative flex-1 md:flex-initial">
              <button
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowSortDropdown(false);
                }}
                className="flex items-center justify-between md:justify-start gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors w-full md:w-auto"
              >
                <div className="flex items-center gap-2">
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
                  <span className="capitalize truncate">
                    {selectedCategory === "all" ? "Category Filter" : selectedCategory}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform flex-shrink-0 ${showCategoryDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Category Dropdown */}
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 capitalize hover:bg-gray-700 transition-colors rounded-t-lg ${selectedCategory === "all" ? "bg-gray-700 text-blue-400" : "text-white"
                      }`}
                  >
                    All Themes
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 capitalize hover:bg-gray-700 transition-colors ${selectedCategory === category ? "bg-gray-700 text-blue-400" : "text-white"
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort By Button */}
            <div className="relative flex-1 md:flex-initial">
              <button
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowCategoryDropdown(false);
                }}
                className="flex items-center justify-between md:justify-start gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors w-full md:w-auto"
              >
                <div className="flex items-center gap-2">
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
                  <span className="capitalize">{sortBy === "newest" ? "Sort By" : sortBy.replace('-', ' ')}</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform flex-shrink-0 ${showSortDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Sort Dropdown */}
              {showSortDropdown && (
                <div className="absolute top-full right-0 md:left-0 mt-2 w-full md:w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <button onClick={() => { setSortBy("newest"); setShowSortDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-t-lg text-white">Newest First</button>
                  <button onClick={() => { setSortBy("oldest"); setShowSortDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 text-white">Oldest First</button>
                  <button onClick={() => { setSortBy("title-asc"); setShowSortDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 text-white">Title A-Z</button>
                  <button onClick={() => { setSortBy("title-desc"); setShowSortDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-b-lg text-white">Title Z-A</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-8 py-4">
        <h2 className="text-lg font-semibold">
          {loading ? "Loading..." : (
            isSearching && queryParam ? `${content.length} matching results` : "All Results"
          )}
        </h2>
      </div>

      {/* Content Grid */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {content.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer hover:bg-gray-800/50 rounded-xl p-2 transition-colors"
              onClick={() => router.push(`/island/${item.id}`)}
            >
              {/* Card Image Placeholder */}
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-gradient-to-b from-sky-300 to-sky-400 relative">
                {/* Mock visual for theme */}
                <div className="absolute inset-0 flex items-center justify-center text-sky-900/20 font-bold text-4xl uppercase tracking-widest">
                  {item.theme || 'ISLAND'}
                </div>
              </div>

              {/* Card Info */}
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-medium truncate">{item.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-2 min-h-[2.5em]">{item.description}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 text-gray-500 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-800 px-2 py-1 rounded uppercase tracking-wider">{item.theme || 'island'}</span>
                  <span>Level {item.level}</span>
                </div>
                <div>
                  {new Date(item.last_updated_at || item.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
