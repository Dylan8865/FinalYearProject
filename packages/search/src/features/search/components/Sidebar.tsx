"use client";

import { Conversation } from "./SearchPage";
import { useTheme } from "../context/ThemeContext";
import IslandIcon from "@/icons/IslandIcon";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onNewChat: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  isLoggedIn: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchActive: boolean;
  onToggleSearch: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  conversations,
  activeConversation,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  isLoggedIn,
  searchQuery,
  onSearchChange,
  isSearchActive,
  onToggleSearch,
}: SidebarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Theme-based colors
  const sidebarBg = isDark ? "bg-[#171717]" : "bg-[#e8e8e8]";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const mutedTextColor = isDark ? "text-gray-400" : "text-gray-600";
  const hoverBg = isDark ? "hover:bg-gray-700" : "hover:bg-gray-300";
  const activeBg = isDark ? "bg-gray-700" : "bg-gray-300";
  const conversationText = isDark ? "text-gray-300" : "text-gray-700";
  const conversationHoverBg = isDark ? "hover:bg-gray-800" : "hover:bg-gray-200";
  const groupConversationsByDate = (conversations: Conversation[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    conversations.forEach((conv) => {
      const date = new Date(conv.createdAt);
      if (date.toDateString() === today.toDateString()) {
        groups.Today.push(conv);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(conv);
      } else if (date > lastWeek) {
        groups["Previous 7 Days"].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  };

  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <aside
      className={`flex h-full flex-col ${sidebarBg} transition-all duration-300 ${
        isOpen ? "w-72" : "w-20"
      }`}
    >
      {/* Header with Logo and Toggle */}
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <button className={`flex h-12 w-12 items-center justify-center rounded-lg text-teal-400 ${hoverBg}`}>
          <div className="scale-125">
            <IslandIcon />
          </div>
        </button>

        {/* Toggle/Expand button */}
        <button
          onClick={onToggle}
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${mutedTextColor} ${hoverBg} ${
            !isOpen ? "hidden" : ""
          }`}
          title="Close sidebar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-2 px-3">
        {/* New Chat */}
        <button
          onClick={onNewChat}
          className={`flex items-center gap-4 rounded-lg px-4 py-3 text-base ${textColor} ${hoverBg}`}
          title="New chat"
        >
          <svg
            className="h-6 w-6 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          {isOpen && <span>New chat</span>}
        </button>

        {/* Search Chats */}
        <button
          onClick={onToggleSearch}
          className={`flex items-center gap-4 rounded-lg px-4 py-3 text-base ${isSearchActive ? textColor : mutedTextColor} ${hoverBg}`}
          title="Search chats"
        >
          <svg
            className="h-6 w-6 shrink-0"
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
          {isOpen && <span>Search chats</span>}
        </button>

        {/* Search Input - Only show when expanded and search is active */}
        {isOpen && isSearchActive && (
          <div className="px-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDark
                    ? "bg-gray-800 text-white placeholder-gray-500"
                    : "bg-white text-gray-900 placeholder-gray-400 border border-gray-300"
                }`}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedTextColor} hover:${textColor}`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Library */}
        <button
          className={`flex items-center gap-4 rounded-lg px-4 py-3 text-base ${mutedTextColor} ${hoverBg}`}
          title="Library"
        >
          <svg
            className="h-6 w-6 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          {isOpen && <span>Library</span>}
        </button>
      </div>

      {/* Conversations List - Only show when expanded */}
      {isOpen && (
        <div className="mt-4 flex-1 overflow-y-auto px-3">
          {!isLoggedIn ? (
            <div className="px-4 py-6 text-center">
              <p className={`mb-4 text-base ${mutedTextColor}`}>
                Sign in to save your search history
              </p>
              <a
                href="/login"
                className="inline-block rounded-lg bg-teal-600 px-5 py-2.5 text-base text-white transition-colors hover:bg-teal-500"
              >
                Sign in
              </a>
            </div>
          ) : conversations.length === 0 ? (
            <p className={`px-4 py-6 text-center text-base ${mutedTextColor}`}>
              No conversations yet
            </p>
          ) : (
            Object.entries(groupedConversations).map(
              ([group, convs]) =>
                convs.length > 0 && (
                  <div key={group} className="mb-5">
                    <h3 className={`mb-3 px-4 text-sm font-medium ${mutedTextColor}`}>
                      {group}
                    </h3>
                    {convs.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`group relative mb-2 flex cursor-pointer items-center rounded-lg px-4 py-3 text-base transition-colors ${
                          activeConversation?.id === conversation.id
                            ? `${activeBg} ${textColor}`
                            : `${conversationText} ${conversationHoverBg}`
                        }`}
                        onClick={() => onSelectConversation(conversation)}
                      >
                        <span className="flex-1 truncate">{conversation.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                          className={`absolute right-3 hidden rounded p-1.5 ${mutedTextColor} ${hoverBg} hover:text-red-400 group-hover:block`}
                          title="Delete"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )
            )
          )}
        </div>
      )}
    </aside>
  );
}
