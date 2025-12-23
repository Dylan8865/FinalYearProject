"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/utils/formatters";
import KnowledgeDetailView from "./KnowledgeDetailView";

interface IslandItem {
  id: string;
  created_at: string;
  title: string | null;
  image_cover_path: string | null;
  status: string | null;
  validity: number | null;
  validation_status: string | null;
  comment: string | null;
  admin_comment: string | null;
  profile_id: string | null;
  profile?: {
    name: string | null;
    email: string | null;
  };
}

interface KnowledgeManagementProps {
  items: IslandItem[];
  stats?: {
    total: number;
    verified: number;
    pending: number;
    declined: number;
    unverified: number;
  };
}

type SortColumn = "title" | "created_at" | "status" | "validity" | "username";
type SortOrder = "none" | "asc" | "desc";

export default function KnowledgeManagement({ items, stats }: KnowledgeManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [userSearchInput, setUserSearchInput] = useState<string>("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState<number>(-1);
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isErrorAnimatingOut, setIsErrorAnimatingOut] = useState(false);
  const [isSuccessAnimatingOut, setIsSuccessAnimatingOut] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IslandItem | null>(null);
  
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const uniqueUsers = Array.from(
    new Set(
      items
        .filter((item) => item.profile?.name && item.profile_id)
        .map((item) => JSON.stringify({ 
          name: item.profile?.name, 
          email: item.profile?.email,
          profileId: item.profile_id 
        }))
    )
  )
    .map((str) => JSON.parse(str))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter users based on search input (including UUID)
  const filteredUsers = uniqueUsers.filter((user) =>
    user.name.toLowerCase().includes(userSearchInput.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchInput.toLowerCase()) ||
    user.profileId.toLowerCase().includes(userSearchInput.toLowerCase())
  );

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  // Initialize filter from URL parameter
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam) {
      setFilterStatus(filterParam);
    }
    // Initialize user filter from URL
    const userIdParam = searchParams.get("userId");
    if (userIdParam) {
      setFilterUser(userIdParam);
      // Find user name to show in search input
      const user = uniqueUsers.find(u => u.profileId === userIdParam);
      if (user) {
        setUserSearchInput(user.name);
      }
    }
    // Open detail if id param is provided
    const idParam = searchParams.get("id");
    if (idParam && !selectedItem) {
      const itemMatch = items.find((it) => it.id === idParam);
      if (itemMatch) {
        setSelectedItem(itemMatch);
      }
    }
  }, [searchParams]);

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
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      item.status === filterStatus;

    const matchesUser =
      filterUser === "all" ||
      item.profile_id === filterUser;

    const matchesDateFrom =
      !filterDateFrom ||
      new Date(item.created_at) >= new Date(filterDateFrom + "T00:00:00");

    const matchesDateTo =
      !filterDateTo ||
      new Date(item.created_at) <= new Date(filterDateTo + "T23:59:59");

    return matchesSearch && matchesStatus && matchesUser && matchesDateFrom && matchesDateTo;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortColumn || sortOrder === "none") {
      // Default: newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    let comparison = 0;
    switch (sortColumn) {
      case "created_at":
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
        break;
      case "title":
      case "status":
        comparison = (a[sortColumn] || "").localeCompare(b[sortColumn] || "");
        break;
      case "validity":
        comparison = (a.validity || 0) - (b.validity || 0);
        break;
      case "username":
        comparison = (a.profile?.name || "").localeCompare(b.profile?.name || "");
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Handle sort column click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: none -> asc -> desc -> none
      if (sortOrder === "none") setSortOrder("asc");
      else if (sortOrder === "asc") setSortOrder("desc");
      else {
        setSortOrder("none");
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column || sortOrder === "none") return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };


  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "verified":
        return "bg-green-500/20 text-green-300";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300";
      case "declined":
        return "bg-red-500/20 text-red-300";
      case "unverified":
        return "bg-gray-500/20 text-gray-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
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
                  <h2 className="text-white text-xl font-semibold">Knowledge-base Management</h2>
                </div>
              </div>
              <button
                onClick={() => router.push("/knowledge/validation-logs")}
                className="bg-[#6D3F33] hover:bg-[#7B4A3A] text-white px-4 py-1 rounded transition-colors flex items-center gap-2"
              >
                <span>View Validation Logs</span>
              </button>
            </div>

            {/* Stats Cards - Single Compact Row */}
            {stats && (
              <div className="grid grid-cols-5 gap-3 mb-4">
                <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                  <div className="text-gray-400 text-[10px] mb-0.5">Total Items</div>
                  <div className="text-white text-lg font-bold">{stats.total}</div>
                </div>
                <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                  <div className="text-gray-400 text-[10px] mb-0.5">Unverified</div>
                  <div className="text-gray-300 text-lg font-bold">{stats.unverified}</div>
                </div>
                <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                  <div className="text-gray-400 text-[10px] mb-0.5">Verified</div>
                  <div className="text-green-300 text-lg font-bold">{stats.verified}</div>
                </div>
                <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                  <div className="text-gray-400 text-[10px] mb-0.5">Pending</div>
                  <div className="text-yellow-300 text-lg font-bold">{stats.pending}</div>
                </div>
                <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                  <div className="text-gray-400 text-[10px] mb-0.5">Declined</div>
                  <div className="text-red-300 text-lg font-bold">{stats.declined}</div>
                </div>
              </div>
            )}

            {/* Search Bar and Filter */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search for knowledge items"
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
                    filterStatus !== "all" || filterUser !== "all" || filterDateFrom || filterDateTo
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
                      {/* Status Filter */}
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-2">Filter by Status</h4>
                        <select
                          value={filterStatus}
                          onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                        >
                          <option value="all">All Status</option>
                          <option value="unverified">Unverified</option>
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      {/* User Filter with Autocomplete */}
                      <div className="relative" ref={userDropdownRef}>
                        <h4 className="text-white text-sm font-semibold mb-2">Filter by Creator</h4>
                        <input
                          type="text"
                          placeholder="Search for user"
                          value={userSearchInput}
                          onChange={(e) => {
                            setUserSearchInput(e.target.value);
                            setShowUserDropdown(true);
                            setSelectedUserIndex(-1);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          onBlur={() => {
                            // Delay to allow click on dropdown items
                            setTimeout(() => setShowUserDropdown(false), 200);
                          }}
                          onKeyDown={(e) => {
                            if (!showUserDropdown || filteredUsers.length === 0) return;
                            const maxResults = Math.min(3, filteredUsers.length);
                            
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setSelectedUserIndex((prev) => (prev < maxResults - 1 ? prev + 1 : prev));
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setSelectedUserIndex((prev) => (prev > 0 ? prev - 1 : -1));
                            } else if (e.key === "Enter" && selectedUserIndex >= 0) {
                              e.preventDefault();
                              const selectedUser = filteredUsers[selectedUserIndex];
                              setFilterUser(selectedUser.profileId);
                              setUserSearchInput(selectedUser.name);
                              setShowUserDropdown(false);
                              setSelectedUserIndex(-1);
                              setCurrentPage(1);
                            } else if (e.key === "Escape") {
                              setShowUserDropdown(false);
                              setSelectedUserIndex(-1);
                            }
                          }}
                          className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                        />
                        {filterUser !== "all" && (
                          <div className="text-xs text-gray-400 mt-1">
                            Selected: {uniqueUsers.find(u => u.profileId === filterUser)?.name || "Unknown"}
                            <button
                              onClick={() => {
                                setFilterUser("all");
                                setUserSearchInput("");
                                setCurrentPage(1);
                              }}
                              className="ml-2 text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        {showUserDropdown && userSearchInput && filteredUsers.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E1E] border border-[#3B3B3B] rounded max-h-48 overflow-y-auto z-20">
                            {filteredUsers.slice(0, 3).map((user, index) => (
                              <button
                                key={user.profileId}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFilterUser(user.profileId);
                                  setUserSearchInput(user.name);
                                  setShowUserDropdown(false);
                                  setSelectedUserIndex(-1);
                                  setCurrentPage(1);
                                }}
                                onMouseEnter={() => setSelectedUserIndex(index)}
                                className={`w-full text-left px-3 py-2 transition-colors text-white text-sm border-b border-[#3B3B3B] last:border-b-0 ${
                                  selectedUserIndex === index ? 'bg-[#282828]' : 'hover:bg-[#282828]'
                                }`}
                              >
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-gray-400 truncate">{user.email}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    {/* Date Range Filter */}
                    <div>
                      <h4 className="text-white text-sm font-semibold mb-2">Filter by Date Range</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-gray-400 text-xs mb-1 block">From</label>
                          <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => {
                              setFilterDateFrom(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B] [color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-xs mb-1 block">To</label>
                          <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => {
                              setFilterDateTo(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B] [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>

                      {/* Filter Actions */}
                      <div className="flex gap-2 pt-2 border-t border-[#3B3B3B]">
                        <button
                          onClick={() => {
                            setFilterStatus("all");
                            setFilterUser("all");
                            setUserSearchInput("");
                            setFilterDateFrom("");
                            setFilterDateTo("");
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

            {/* Items Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#282828] border-b border-[#3B3B3B]">
                  <tr>
                    <th
                      onClick={() => handleSort("title")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Title{getSortIcon("title")}
                    </th>
                    <th
                      onClick={() => handleSort("username")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Created By{getSortIcon("username")}
                    </th>
                    <th
                      onClick={() => handleSort("created_at")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Created At{getSortIcon("created_at")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Status{getSortIcon("status")}
                    </th>
                    <th
                      onClick={() => handleSort("validity")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Validity{getSortIcon("validity")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="border-b border-[#3B3B3B] hover:bg-[#282828] cursor-pointer transition-colors"
                    >
                      <td className="text-white text-sm py-3 px-4">{item.title || "Untitled"}</td>
                      <td className="text-white text-sm py-3 px-4">{item.profile?.name || "Unknown"}</td>
                      <td className="text-white text-sm py-3 px-4">{formatDate(item.created_at)}</td>
                      <td className="text-white text-sm py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(item.status)}`}
                        >
                          {item.status || "Unknown"}
                        </span>
                      </td>
                      <td className="text-white text-sm py-3 px-4">
                        {item.validity !== null && item.validity !== undefined ? (
                          <span
                            className={`font-semibold ${
                              item.validity >= 60
                                ? "text-green-400"
                                : item.validity >= 55
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {item.validity.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-8">
                        No knowledge items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#3B3B3B]">
                <div className="flex items-center gap-4">
                  <div className="text-gray-400 text-sm">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedItems.length)} of {sortedItems.length} items
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
                      <option value={10}>10</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
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
                          {currentPage > 4 && <span className="text-gray-400">...</span>}
                        </>
                      )}
                      
                      {/* Show pages around current page */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === currentPage || 
                                 page === currentPage - 1 || 
                                 page === currentPage - 2 ||
                                 page === currentPage + 1 || 
                                 page === currentPage + 2;
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
                          {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Detail View Sidebar */}
      {selectedItem && (
        <KnowledgeDetailView
          item={selectedItem}
          onClose={() => {
            const from = searchParams.get("from");
            const logId = searchParams.get("logId");
            if (from === "logs") {
              router.push(`/knowledge/validation-logs${logId ? `?logId=${logId}` : ""}`);
            } else {
              setSelectedItem(null);
            }
          }}
          onUpdate={() => {
            setSelectedItem(null);
            router.refresh();
          }}
          onError={(message: string) => setErrorMessage(message)}
          onSuccess={(message: string) => setSuccessMessage(message)}
        />
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className={`fixed bottom-4 right-4 bg-[#333333] border-2 border-red-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50 ${isErrorAnimatingOut ? 'animate-slide-out' : 'animate-slide-in'}`}>
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
        <div className={`fixed bottom-4 right-4 bg-[#333333] border-2 border-green-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50 ${isSuccessAnimatingOut ? 'animate-slide-out' : 'animate-slide-in'}`}>
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
