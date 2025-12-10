"use client";

import { Conversation } from "./SearchPage";
import IslandIcon from "@/icons/IslandIcon";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onNewChat: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  conversations,
  activeConversation,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
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
      className={`flex h-full flex-col bg-[#171717] transition-all duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Header with Logo and Toggle */}
      <div className="flex h-14 items-center justify-between px-3">
        {/* Logo */}
        <button className="flex h-10 w-10 items-center justify-center rounded-lg text-teal-400 hover:bg-gray-700">
          <IslandIcon />
        </button>

        {/* Toggle/Expand button */}
        <button
          onClick={onToggle}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white ${
            !isOpen ? "hidden" : ""
          }`}
          title="Close sidebar"
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
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-1 px-2">
        {/* New Chat */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-gray-700"
          title="New chat"
        >
          <svg
            className="h-5 w-5 shrink-0"
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
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
          title="Search chats"
        >
          <svg
            className="h-5 w-5 shrink-0"
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

        {/* Library */}
        <button
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
          title="Library"
        >
          <svg
            className="h-5 w-5 shrink-0"
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
        <div className="mt-4 flex-1 overflow-y-auto px-2">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-500">
              No conversations yet
            </p>
          ) : (
            Object.entries(groupedConversations).map(
              ([group, convs]) =>
                convs.length > 0 && (
                  <div key={group} className="mb-4">
                    <h3 className="mb-2 px-3 text-xs font-medium text-gray-500">
                      {group}
                    </h3>
                    {convs.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`group relative mb-1 flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                          activeConversation?.id === conversation.id
                            ? "bg-gray-700 text-white"
                            : "text-gray-300 hover:bg-gray-800"
                        }`}
                        onClick={() => onSelectConversation(conversation)}
                      >
                        <span className="flex-1 truncate">{conversation.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                          className="absolute right-2 hidden rounded p-1 text-gray-500 hover:bg-gray-600 hover:text-red-400 group-hover:block"
                          title="Delete"
                        >
                          <svg
                            className="h-4 w-4"
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
