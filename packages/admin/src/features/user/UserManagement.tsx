"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserEditModal from "./UserEditPopup";
import CreateAccountModal from "./CreateAccountPopup";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  last_login_time: string | null;
  mana: number | null;
  level: number | null;
  type: string | null;
}

interface UserManagementProps {
  users: User[];
}

type SortColumn = "name" | "created_at" | "email" | "last_login_time" | "mana" | "level" | "type";
type SortOrder = "none" | "asc" | "desc";

export default function UserManagement({ users }: UserManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isErrorAnimatingOut, setIsErrorAnimatingOut] = useState(false);
  const [isSuccessAnimatingOut, setIsSuccessAnimatingOut] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Initialize filter from URL parameter
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam) {
      setFilterType(filterParam);
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

  // Filter users based on search and filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      user.type === filterType;

    return matchesSearch && matchesFilter;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortColumn || sortOrder === "none") return 0;

    let comparison = 0;
    switch (sortColumn) {
      case "created_at":
      case "last_login_time":
        const dateA = a[sortColumn] ? new Date(a[sortColumn]!).getTime() : 0;
        const dateB = b[sortColumn] ? new Date(b[sortColumn]!).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case "name":
      case "email":
      case "type":
        comparison = (a[sortColumn] || "").localeCompare(b[sortColumn] || "");
        break;
      case "level":
      case "mana":
        comparison = (a[sortColumn] || 0) - (b[sortColumn] || 0);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
                  <h2 className="text-white text-xl font-semibold">User Management</h2>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#6D3F33] hover:bg-[#7B4A3A] text-white px-4 py-1 rounded transition-colors flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                <span>Create Account</span>
              </button>
            </div>

            {/* Search Bar and Filter */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search for users"
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
                  className="bg-[#1E1E1E] text-white px-6 py-2 rounded-full border border-[#3B3B3B] hover:bg-[#252525] transition-colors"
                >
                  Filter
                </button>

                {/* Filter Dropdown */}
                {showFilter && (
                  <div className="absolute top-10 right-0 bg-[#282828] border border-[#3B3B3B] rounded-lg p-4 min-w-[200px] z-10">
                    <h4 className="text-white text-sm font-semibold mb-2">Filter by Type</h4>
                    <select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                        setShowFilter(false);
                      }}
                      className="w-full bg-[#1E1E1E] text-white px-3 py-1 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                    >
                      <option value="all">All Users</option>
                      <option value="admin">Admin</option>
                      <option value="island">Island</option>
                      <option value="non-island">Non-Island</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* User Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#282828] border-b border-[#3B3B3B]">
                  <tr>
                    <th
                      onClick={() => handleSort("name")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Username{getSortIcon("name")}
                    </th>
                    <th
                      onClick={() => handleSort("created_at")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Creation Time{getSortIcon("created_at")}
                    </th>
                    <th
                      onClick={() => handleSort("email")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Email{getSortIcon("email")}
                    </th>
                    <th
                      onClick={() => handleSort("last_login_time")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Last Login{getSortIcon("last_login_time")}
                    </th>
                    <th
                      onClick={() => handleSort("mana")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Mana{getSortIcon("mana")}
                    </th>
                    <th
                      onClick={() => handleSort("level")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Level{getSortIcon("level")}
                    </th>
                    <th
                      onClick={() => handleSort("type")}
                      className="text-left text-white text-sm font-semibold py-3 px-4 cursor-pointer hover:bg-[#333333] transition-colors select-none"
                    >
                      Type{getSortIcon("type")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="border-b border-[#3B3B3B] hover:bg-[#282828] cursor-pointer transition-colors"
                    >
                      <td className="text-white text-sm py-3 px-4">{user.name || "N/A"}</td>
                      <td className="text-white text-sm py-3 px-4">{formatDate(user.created_at)}</td>
                      <td className="text-white text-sm py-3 px-4">{user.email || "N/A"}</td>
                      <td className="text-white text-sm py-3 px-4">{formatDate(user.last_login_time)}</td>
                      <td className="text-white text-sm py-3 px-4">{user.mana?.toLocaleString() || "0"}</td>
                      <td className="text-white text-sm py-3 px-4">{user.level || "0"}</td>
                      <td className="text-white text-sm py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs capitalize ${
                            user.type === "admin"
                              ? "bg-red-500/20 text-red-300"
                              : user.type === "island"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {user.type || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-400 py-8">
                        No users found
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
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} users
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

      {/* Edit Modal */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => {
            setSelectedUser(null);
            router.refresh();
          }}
          onError={(message) => setErrorMessage(message)}
          onSuccess={(message) => setSuccessMessage(message)}
        />
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            setSuccessMessage("Account created successfully!");
            router.refresh();
          }}
          onError={(message) => {
            setShowCreateModal(false);
            setErrorMessage(message);
          }}
        />
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className={`fixed bottom-4 right-4 bg-[#333333] border border-red-600 border-2 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50 ${isErrorAnimatingOut ? 'animate-slide-out' : 'animate-slide-in'}`}>
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
        <div className={`fixed bottom-4 right-4 bg-[#333333] border border-green-600 border-2 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50 ${isSuccessAnimatingOut ? 'animate-slide-out' : 'animate-slide-in'}`}>
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
