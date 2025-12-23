"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/utils/formatters";

interface ValidationLog {
  id: string;
  created_at: string;
  status: string | null;
  error: string | null;
  retry_count: number | null;
  request: any | null;
  response: any | null;
  island_item: {
    id: string;
    title: string | null;
    profile_id: string;
    profile: {
      name: string | null;
      email: string | null;
    };
  } | null;
}

interface ValidationStats {
  totalRequests: number;
  successfulValidations: number;
  failedValidations: number;
  pendingValidations: number;
  validationsByDay: { [key: string]: number };
  topUsers: Array<{ userId: string; name: string; count: number }>;
}

interface ValidationLogDashboardProps {
  logs: ValidationLog[];
  stats: ValidationStats;
}

type SortColumn = "created_at" | "status" | "user" | "retry_count";
type SortOrder = "none" | "asc" | "desc";

export default function ValidationLogDashboard({ logs, stats }: ValidationLogDashboardProps) {
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
  const [sortColumn, setSortColumn] = useState<SortColumn | null>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState<ValidationLog | null>(null);
  const [idCopySuccess, setIdCopySuccess] = useState(false);
  const [requestCopySuccess, setRequestCopySuccess] = useState(false);
  const [responseCopySuccess, setResponseCopySuccess] = useState(false);
  const [itemIdCopySuccess, setItemIdCopySuccess] = useState(false);
  
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Get unique users from logs
  const uniqueUsers = Array.from(
    new Set(
      logs
        .filter((log) => log.island_item?.profile?.name && log.island_item?.profile_id)
        .map((log) => JSON.stringify({ 
          name: log.island_item?.profile?.name, 
          email: log.island_item?.profile?.email,
          profileId: log.island_item?.profile_id 
        }))
    )
  )
    .map((str) => JSON.parse(str))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter users based on search input
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

  const handleCopyId = async () => {
    try {
      if (selectedLog?.id) {
        await navigator.clipboard.writeText(selectedLog.id);
        setIdCopySuccess(true);
        setTimeout(() => setIdCopySuccess(false), 2000);
      }
    } catch (error) {
      // Silent fail
    }
  };
  // Auto-open selected log modal when returning via deep link
  useEffect(() => {
    const logId = searchParams.get("logId");
    if (logId && !selectedLog) {
      const match = logs.find((l) => l.id === logId);
      if (match) setSelectedLog(match);
    }
  }, [searchParams, logs]);

  const handleCopyRequest = async () => {
    try {
      if (selectedLog?.request) {
        await navigator.clipboard.writeText(JSON.stringify(selectedLog.request, null, 2));
        setRequestCopySuccess(true);
        setTimeout(() => setRequestCopySuccess(false), 2000);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleCopyResponse = async () => {
    try {
      if (selectedLog?.response) {
        await navigator.clipboard.writeText(JSON.stringify(selectedLog.response, null, 2));
        setResponseCopySuccess(true);
        setTimeout(() => setResponseCopySuccess(false), 2000);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleCopyItemId = async () => {
    try {
      if (selectedLog?.island_item?.id) {
        await navigator.clipboard.writeText(selectedLog.island_item.id);
        setItemIdCopySuccess(true);
        setTimeout(() => setItemIdCopySuccess(false), 2000);
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Filter logs based on search and filter
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.island_item?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.island_item?.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.island_item?.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || log.status === filterStatus;

    const matchesUser =
      filterUser === "all" ||
      log.island_item?.profile_id === filterUser;

    const matchesDateFrom =
      !filterDateFrom ||
      new Date(log.created_at) >= new Date(filterDateFrom + "T00:00:00");

    const matchesDateTo =
      !filterDateTo ||
      new Date(log.created_at) <= new Date(filterDateTo + "T23:59:59");

    return matchesSearch && matchesStatus && matchesUser && matchesDateFrom && matchesDateTo;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortColumn || sortOrder === "none") {
      // Default: newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    let comparison = 0;
    switch (sortColumn) {
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "status":
        comparison = (a.status || "").localeCompare(b.status || "");
        break;
      case "user":
        comparison = (a.island_item?.profile?.name || "").localeCompare(
          b.island_item?.profile?.name || ""
        );
        break;
      case "retry_count":
        comparison = (a.retry_count || 0) - (b.retry_count || 0);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

  // Handle sort column click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
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
      case "queued":
        return "bg-blue-500/20 text-blue-300";
      case "processing":
        return "bg-yellow-500/20 text-yellow-300";
      case "completed":
        return "bg-green-500/20 text-green-300";
      case "failed":
        return "bg-red-500/20 text-red-300";
      case "superseeded":
        return "bg-gray-500/30 text-gray-200";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const successRate =
    stats.totalRequests > 0
      ? ((stats.successfulValidations / stats.totalRequests) * 100).toFixed(1)
      : "0";

  // Calculate actual failed count (total - successful - pending)
  const actualFailedCount = stats.totalRequests - stats.successfulValidations - stats.pendingValidations;

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
                  onClick={() => router.push("/knowledge")}
                  className="text-white text-2xl mr-4 hover:text-gray-300 transition-colors"
                >
                  &lt;
                </button>
                <div>
                  <h2 className="text-white text-xl font-semibold">Validation Log Monitor</h2>
                </div>
              </div>
            </div>

            {/* Stats Cards - Single Compact Row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                <div className="text-gray-400 text-[10px] mb-0.5">Total Requests</div>
                <div className="text-white text-lg font-bold">{stats.totalRequests}</div>
              </div>
              <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                <div className="text-gray-400 text-[10px] mb-0.5">Successful</div>
                <div className="text-green-300 text-lg font-bold">{stats.successfulValidations}</div>
              </div>
              <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                <div className="text-gray-400 text-[10px] mb-0.5">Failed</div>
                <div className="text-red-300 text-lg font-bold">{actualFailedCount > 0 ? actualFailedCount : stats.failedValidations}</div>
              </div>
              <div className="bg-[#282828] rounded-lg p-2 border border-[#3B3B3B]">
                <div className="text-gray-400 text-[10px] mb-0.5">Success Rate</div>
                <div className="text-blue-400 text-lg font-bold">{successRate}%</div>
              </div>
            </div>

            {/* Search Bar and Filter */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search validation logs"
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
                          <option value="queued">Queued</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="superseeded">Superseeded</option>
                        </select>
                      </div>

                      {/* User Filter with Autocomplete */}
                      <div className="relative" ref={userDropdownRef}>
                        <h4 className="text-white text-sm font-semibold mb-2">Filter by Creator</h4>
                        <input
                          type="text"
                          placeholder="Search by username, email, or user ID..."
                          value={userSearchInput}
                          onChange={(e) => {
                            setUserSearchInput(e.target.value);
                            setShowUserDropdown(true);
                            setSelectedUserIndex(-1);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          onBlur={() => {
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

            {/* Two Column Layout: Top Users (Left) + Table (Right) */}
            <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
              {/* Left Sidebar - Top Users */}
              <div className="w-64 flex-shrink-0">
                <div className="bg-[#282828] rounded-lg p-4 border border-[#3B3B3B] h-full flex flex-col">
                  <h3 className="text-white text-sm font-semibold mb-3">Top Users by Requests</h3>
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {stats.topUsers.slice(0, 20).map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="text-gray-400 text-xs w-5 flex-shrink-0">#{index + 1}</div>
                          <div className="text-white text-xs truncate">{user.name || "Unknown"}</div>
                        </div>
                        <div className="text-blue-400 text-xs font-semibold flex-shrink-0">{user.count}</div>
                      </div>
                    ))}
                    {stats.topUsers.length === 0 && (
                      <div className="text-gray-400 text-xs text-center py-4">No data available</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Section - Takes most space */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Logs Table */}
                <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#282828] border-b border-[#3B3B3B]">
                  <tr>
                    <th
                      onClick={() => handleSort("created_at")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Timestamp{getSortIcon("created_at")}
                    </th>
                    <th
                      onClick={() => handleSort("user")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      User{getSortIcon("user")}
                    </th>
                    <th className="text-left text-white text-sm font-semibold py-3 px-4">Item</th>
                    <th
                      onClick={() => handleSort("status")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Status{getSortIcon("status")}
                    </th>
                    <th
                      onClick={() => handleSort("retry_count")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Retries{getSortIcon("retry_count")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                {paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="border-b border-[#3B3B3B] hover:bg-[#282828] transition-colors cursor-pointer"
                  >
                    <td className="text-white text-sm py-3 px-4">{formatDate(log.created_at)}</td>
                    <td className="text-white text-sm py-3 px-4">
                      {log.island_item?.profile?.name || "Unknown"}
                    </td>
                    <td className="text-white text-sm py-3 px-4">
                      {log.island_item?.title || "Untitled"}
                    </td>
                    <td className="text-white text-sm py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(log.status)}`}>
                        {log.status || "Unknown"}
                      </span>
                    </td>
                    <td className="text-white text-sm py-3 px-4">{log.retry_count || 0}</td>
                  </tr>
                ))}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      No validation logs found
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
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedLogs.length)} of {sortedLogs.length} logs
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
        </div>
      </div>

      {/* Log Details Popup */}
      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-[#333333] rounded-lg border border-[#3B3B3B] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Log ID</label>
                <div className="flex items-center gap-2">
                  <div className="text-white text-sm font-mono">{selectedLog.id}</div>
                  <button
                    onClick={handleCopyId}
                    className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                  >
                    {idCopySuccess ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Timestamp</div>
                <div className="text-white text-sm">{formatDate(selectedLog.created_at)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">User</div>
                <div className="text-white text-sm">
                  {selectedLog.island_item?.profile?.name || "Unknown"} (
                  {selectedLog.island_item?.profile?.email || "N/A"})
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Item</div>
                <div className="text-white text-sm">{selectedLog.island_item?.title || "Untitled"}</div>
                <div className="mt-2">
                  <label className="text-gray-400 text-xs mb-1 block">Item ID</label>
                  <div className="flex items-center gap-2">
                    <div className="text-white text-xs font-mono">{selectedLog.island_item?.id || "N/A"}</div>
                    {selectedLog?.island_item?.id && (
                      <>
                        <button
                          onClick={handleCopyItemId}
                          className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                        >
                          {itemIdCopySuccess ? "Copied" : "Copy"}
                        </button>
                        <button
                          onClick={() => {
                            const id = selectedLog?.island_item?.id;
                            const logId = selectedLog?.id;
                            if (id && logId) {
                              router.push(`/knowledge?id=${id}&from=logs&logId=${logId}`);
                            } else if (id) {
                              router.push(`/knowledge?id=${id}`);
                            }
                          }}
                          className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                        >
                          Open
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Status</div>
                <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(selectedLog.status)}`}>
                  {selectedLog.status || "Unknown"}
                </span>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Retry Count</div>
                <div className="text-white text-sm">{selectedLog.retry_count || 0}</div>
              </div>
              {selectedLog.request && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-400 text-xs">Request Data</label>
                    <button
                      onClick={handleCopyRequest}
                      className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                    >
                      {requestCopySuccess ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-[#1E1E1E] p-3 rounded border border-[#3B3B3B] max-h-60 overflow-auto">
                    <pre className="text-white text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.request, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {selectedLog.response && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-400 text-xs">Response Data</label>
                    <button
                      onClick={handleCopyResponse}
                      className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                    >
                      {responseCopySuccess ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-[#1E1E1E] p-3 rounded border border-[#3B3B3B] max-h-60 overflow-auto">
                    <pre className="text-white text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {selectedLog.error && (
                <div>
                  <div className="text-gray-400 text-sm mb-1">Error Message</div>
                  <div className="text-red-400 text-sm bg-[#1E1E1E] p-3 rounded border border-red-400/30">
                    {selectedLog.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
