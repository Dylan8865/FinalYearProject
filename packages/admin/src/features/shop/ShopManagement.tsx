"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ItemEditModal from "./ItemEditPopup";

interface Item {
  id: string;
  name: string | null;
  type: string | null;
  mana_required: number | null;
  mana_rate: number | null;
  image_cover_path: string | null;
}

interface ShopManagementProps {
  items: Item[];
}

export default function ShopManagement({ items }: ShopManagementProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterManaMin, setFilterManaMin] = useState<string>("");
  const [filterManaMax, setFilterManaMax] = useState<string>("");
  const [filterRateMin, setFilterRateMin] = useState<string>("");
  const [filterRateMax, setFilterRateMax] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isErrorAnimatingOut, setIsErrorAnimatingOut] = useState(false);
  const [isSuccessAnimatingOut, setIsSuccessAnimatingOut] = useState(false);

  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Validation handlers for filter inputs
  const handleManaMinChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue === "") {
      setFilterManaMin("");
      return;
    }
    // Check length first (9999999 is 7 digits max)
    if (cleanValue.length > 7) {
      return;
    }
    const numValue = parseInt(cleanValue);
    if (!isNaN(numValue) && numValue <= 9999999) {
      setFilterManaMin(cleanValue);
    }
  };

  const handleManaMaxChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue === "") {
      setFilterManaMax("");
      return;
    }
    if (cleanValue.length > 7) {
      return;
    }
    const numValue = parseInt(cleanValue);
    if (!isNaN(numValue) && numValue <= 9999999) {
      setFilterManaMax(cleanValue);
    }
  };

  const handleRateMinChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue === "") {
      setFilterRateMin("");
      return;
    }
    // Check length first (999 is 3 digits max)
    if (cleanValue.length > 3) {
      return;
    }
    const numValue = parseInt(cleanValue);
    if (!isNaN(numValue) && numValue <= 999) {
      setFilterRateMin(cleanValue);
    }
  };

  const handleRateMaxChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue === "") {
      setFilterRateMax("");
      return;
    }
    if (cleanValue.length > 3) {
      return;
    }
    const numValue = parseInt(cleanValue);
    if (!isNaN(numValue) && numValue <= 999) {
      setFilterRateMax(cleanValue);
    }
  };

  // Prevent non-numeric key input
  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      return;
    }
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
      return;
    }
    // Block anything that's not a digit
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Initialize filter from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get("filter");
    if (
      filterParam &&
      ["decorative", "terrain", "functional"].includes(filterParam)
    ) {
      setFilterType(filterParam);
    }
  }, []);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-hide error message after 5 seconds
  useEffect(() => {
    if (errorMessage && !isErrorAnimatingOut) {
      const timer = setTimeout(() => {
        setIsErrorAnimatingOut(true);
        setTimeout(() => {
          setErrorMessage(null);
          setIsErrorAnimatingOut(false);
        }, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, isErrorAnimatingOut]);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage && !isSuccessAnimatingOut) {
      const timer = setTimeout(() => {
        setIsSuccessAnimatingOut(true);
        setTimeout(() => {
          setSuccessMessage(null);
          setIsSuccessAnimatingOut(false);
        }, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, isSuccessAnimatingOut]);

  // Filter items based on search and filter
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || item.type === filterType;

    const matchesManaMin = !filterManaMin || (item.mana_required || 0) >= (Number(filterManaMin) || 0);
    const matchesManaMax = !filterManaMax || (item.mana_required || 0) <= (Number(filterManaMax) || Infinity);

    const matchesRateMin = !filterRateMin || (item.mana_rate || 0) >= (Number(filterRateMin) || 0);
    const matchesRateMax = !filterRateMax || (item.mana_rate || 0) <= (Number(filterRateMax) || Infinity);

    return matchesSearch && matchesType && matchesManaMin && matchesManaMax && matchesRateMin && matchesRateMax;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    return (a.name || "").localeCompare(b.name || "");
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Get image URL from Supabase public bucket
  const getImageUrl = (imagePath: string | null, itemId: string) => {
    if (!imagePath || imageErrors.has(itemId)) return null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/items/${imagePath}`;
  };

  const handleImageError = (itemId: string) => {
    setImageErrors((prev) => new Set(prev).add(itemId));
  };

  return (
    <>
      <div className="pl-8 pr-8 pt-2">
        <div className="h-[calc(100vh-120px)]">
          {/* Main Card */}
          <div className="bg-[#333333] rounded-lg p-6 h-full flex flex-col">
            {/* Header with Back Button and Title */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-white text-2xl mr-4 hover:text-gray-300 transition-colors"
                >
                  &lt;
                </button>
                <div>
                  <h2 className="text-white text-xl font-semibold">
                    Shop Management
                  </h2>
                </div>
              </div>
            </div>

            {/* Search Bar and Filter */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search for items"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
              />
              <div className="relative">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`px-6 py-2 rounded-full border transition-colors ${
                    filterType !== "all" || filterManaMin || filterManaMax || filterRateMin || filterRateMax
                      ? 'bg-[#6D3F33] border-[#7B4A3A] text-white'
                      : 'bg-[#1E1E1E] border-[#3B3B3B] text-white hover:bg-[#252525]'
                  }`}
                >
                  Filter
                </button>

                {/* Filter Dropdown */}
                {showFilter && (
                  <div ref={filterPanelRef} className="absolute top-10 right-0 bg-[#282828] border border-[#3B3B3B] rounded-lg w-[420px] z-10 max-h-[55vh] overflow-y-auto">
                    <div className="p-4 space-y-4">
                      {/* Type Filter */}
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-2">Filter by Type</h4>
                        <select
                          value={filterType}
                          onChange={(e) => {
                            setFilterType(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                        >
                          <option value="all">All Types</option>
                          <option value="decorative">Decorative</option>
                          <option value="terrain">Terrain</option>
                          <option value="functional">Functional</option>
                        </select>
                      </div>

                      {/* Mana Required Filter */}
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-2">Filter by Mana Required</h4>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-gray-400 text-xs mb-1 block">Min</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={filterManaMin}
                              onChange={(e) => {
                                handleManaMinChange(e.target.value);
                                setCurrentPage(1);
                              }}
                              onKeyDown={handleNumericKeyDown}
                              className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                              min="0"
                              max="9999999"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-gray-400 text-xs mb-1 block">Max</label>
                            <input
                              type="number"
                              placeholder="9999999"
                              value={filterManaMax}
                              onChange={(e) => {
                                handleManaMaxChange(e.target.value);
                                setCurrentPage(1);
                              }}
                              onKeyDown={handleNumericKeyDown}
                              className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                              min="0"
                              max="9999999"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mana Rate Filter */}
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-2">Filter by Mana Rate</h4>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-gray-400 text-xs mb-1 block">Min</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={filterRateMin}
                              onChange={(e) => {
                                handleRateMinChange(e.target.value);
                                setCurrentPage(1);
                              }}
                              onKeyDown={handleNumericKeyDown}
                              className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                              min="0"
                              max="999"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-gray-400 text-xs mb-1 block">Max</label>
                            <input
                              type="number"
                              placeholder="999"
                              value={filterRateMax}
                              onChange={(e) => {
                                handleRateMaxChange(e.target.value);
                                setCurrentPage(1);
                              }}
                              onKeyDown={handleNumericKeyDown}
                              className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                              min="0"
                              max="999"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Filter Actions */}
                      <div className="flex gap-2 pt-2 border-t border-[#3B3B3B]">
                        <button
                          onClick={() => {
                            setFilterType("all");
                            setFilterManaMin("");
                            setFilterManaMax("");
                            setFilterRateMin("");
                            setFilterRateMax("");
                            setCurrentPage(1);
                          }}
                          className="flex-1 bg-[#1E1E1E] hover:bg-[#252525] text-white px-3 py-2 rounded border border-[#3B3B3B] transition-colors text-sm"
                        >
                          Clear Filters
                        </button>
                        <button
                          onClick={() => setShowFilter(false)}
                          className="flex-1 bg-[#6D3F33] hover:bg-[#7B4A3A] text-white px-3 py-2 rounded transition-colors text-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-auto">
              {paginatedItems.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-center">No items found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
                  {paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="bg-[#282828] rounded-lg overflow-hidden cursor-pointer hover:bg-[#303030] transition-colors border border-[#3B3B3B] hover:border-[#7B7B7B] flex flex-col h-[300px]"
                    >
                      {/* Item Image */}
                      <div className="w-full h-[180px] relative bg-[#1E1E1E] flex items-center justify-center p-2">
                        {getImageUrl(item.image_cover_path, item.id) ? (
                          <img
                            src={getImageUrl(item.image_cover_path, item.id)!}
                            alt={item.name || "Item"}
                            className="max-w-full max-h-full object-contain"
                            onError={() => handleImageError(item.id)}
                          />
                        ) : (
                          <div className="text-gray-500 text-xs text-center">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="text-white text-sm font-semibold mb-2 truncate">
                          {item.name || "Unknown"}
                        </h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Type:</span>
                            <span
                              className={`px-2 py-0.5 rounded capitalize ${
                                item.type === "decorative"
                                  ? "bg-purple-500/20 text-purple-300"
                                  : item.type === "terrain"
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-blue-500/20 text-blue-300"
                              }`}
                            >
                              {item.type || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Price:</span>
                            <span className="text-white">
                              {item.mana_required?.toLocaleString() || "0"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Mana Rate:</span>
                            <span className="text-white">
                              {item.mana_rate || "0"}/m
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#3B3B3B]">
                <div className="flex items-center gap-4">
                  <div className="text-gray-400 text-sm">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredItems.length)} of{" "}
                    {filteredItems.length} items
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-gray-400 text-sm">Per page:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-[#1E1E1E] text-white px-3 py-1 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B] text-sm"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-gray-400 text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] hover:bg-[#252525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {/* Show first page */}
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-2 rounded border bg-[#1E1E1E] text-white border-[#3B3B3B] hover:bg-[#252525] transition-colors"
                          >
                            1
                          </button>
                          {currentPage > 4 && (
                            <span className="text-gray-400">...</span>
                          )}
                        </>
                      )}

                      {/* Show pages around current page */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === currentPage ||
                            page === currentPage - 1 ||
                            page === currentPage - 2 ||
                            page === currentPage + 1 ||
                            page === currentPage + 2
                          );
                        })
                        .map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded border transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-[#1E1E1E] text-white border-[#3B3B3B] hover:bg-[#252525]"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                      {/* Show last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <span className="text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-2 rounded border bg-[#1E1E1E] text-white border-[#3B3B3B] hover:bg-[#252525] transition-colors"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] hover:bg-[#252525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedItem && (
        <ItemEditModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={() => {
            setSelectedItem(null);
            router.refresh();
          }}
          onError={(message) => setErrorMessage(message)}
          onSuccess={(message) => setSuccessMessage(message)}
        />
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div
          className={`fixed bottom-4 right-4 bg-[#333333] border-red-600 border-2 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50 ${
            isErrorAnimatingOut ? "animate-slide-out" : "animate-slide-in"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl flex-shrink-0 mr-2">✕</div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Error</h4>
              <p className="text-sm">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-8 text-white hover:text-gray-200 text-xl leading-none px-3"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div
          className={`fixed bottom-4 right-4 bg-[#333333] border-green-600 border-2 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50 ${
            isSuccessAnimatingOut ? "animate-slide-out" : "animate-slide-in"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl flex-shrink-0 mr-2">✓</div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Success</h4>
              <p className="text-sm">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-8 text-white hover:text-gray-200 text-xl leading-none px-3"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
