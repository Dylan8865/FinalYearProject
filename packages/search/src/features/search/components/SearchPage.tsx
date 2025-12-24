"use client";

import { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import WelcomeScreen from "./WelcomeScreen";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import type { User } from "@supabase/supabase-js";
import { NAV_URLS } from "@/utils/navigation";

export interface SearchSource {
  id: string;
  title: string;
  content: string;
  validityScore: number;
  createdAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  sources?: SearchSource[];
  relatedTopics?: string[];
  feedback?: "positive" | "negative" | null;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  isFavorite?: boolean;
}

interface SearchPageProps {
  user: User | null;
  profile?: { name?: string; email?: string } | null;
}

export default function SearchPage({ user, profile }: SearchPageProps) {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Theme-based colors
  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-[#1a1a1a]" : "bg-[#f5f5f5]";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const mutedTextColor = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-300";
  const hoverBg = isDark ? "hover:bg-gray-800" : "hover:bg-gray-200";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  // Load saved chats from database on mount
  useEffect(() => {
    const loadSavedChats = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/chat?profileId=${user.id}`);
        const data = await response.json();

        if (data.success && data.chats) {
          // Load each chat with its messages
          const loadedConversations = await Promise.all(
            data.chats.map(
              async (chat: {
                id: string;
                title: string;
                created_at: string;
                is_favorite?: boolean;
              }) => {
                const historyResponse = await fetch(
                  `/api/history?chatId=${chat.id}`
                );
                const historyData = await historyResponse.json();

                // Fetch feedback for this chat
                const feedbackResponse = await fetch(
                  `/api/feedback/messages?chatId=${chat.id}&profileId=${user.id}`
                );
                const feedbackData = await feedbackResponse.json();
                const feedbackMap = feedbackData.success
                  ? feedbackData.feedback
                  : {};

                const messages: Message[] = [];

                if (historyData.success && historyData.history) {
                  historyData.history.forEach(
                    (entry: {
                      id: string;
                      prompt_text: string;
                      result_text: string;
                      created_at: string;
                    }) => {
                      // Add user message - use history ID + 'user' suffix
                      messages.push({
                        id: `${entry.id}-user`,
                        role: "user",
                        content: entry.prompt_text,
                        timestamp: new Date(entry.created_at),
                      });

                      // Add assistant message - use history ID as message ID for feedback matching
                      messages.push({
                        id: entry.id,
                        role: "assistant",
                        content: entry.result_text,
                        timestamp: new Date(entry.created_at),
                        feedback: feedbackMap[entry.id] || null,
                      });
                    }
                  );
                }

                return {
                  id: chat.id,
                  title: chat.title,
                  messages,
                  createdAt: new Date(chat.created_at),
                  isFavorite: chat.is_favorite || false,
                };
              }
            )
          );

          setConversations(loadedConversations);

          // Check if there's a chatId in URL query params (from analytics revisit)
          const urlParams = new URLSearchParams(window.location.search);
          const chatIdFromUrl = urlParams.get("chatId");

          if (chatIdFromUrl) {
            const chatToOpen = loadedConversations.find(
              (c) => c.id === chatIdFromUrl
            );
            if (chatToOpen) {
              setActiveConversation(chatToOpen);
            }
            // Clear the URL parameter
            window.history.replaceState({}, "", "/search");
          }
        }
      } catch (error) {
        console.error("Error loading saved chats:", error);
      }
    };

    loadSavedChats();
  }, [user?.id]);

  const handleNewChat = () => {
    setActiveConversation(null);
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    let conversation = activeConversation;

    if (!conversation) {
      conversation = {
        id: crypto.randomUUID(),
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
      };
      setConversations((prev) => [conversation!, ...prev]);
    }

    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage],
    };

    setActiveConversation(updatedConversation);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation!.id ? updatedConversation : c))
    );

    // Add loading message
    setIsLoading(true);
    const loadingMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    const withLoading = {
      ...updatedConversation,
      messages: [...updatedConversation.messages, loadingMessage],
    };
    setActiveConversation(withLoading);

    // Call search API
    try {
      const searchPayload = {
        query: content,
        chatId: conversation.id,
        userId: user?.id,
        promptOrder: conversation.messages.length,
      };

      console.log("Sending search request:", searchPayload);

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchPayload),
      });

      const data = await response.json();

      let assistantContent: string;

      if (!data.success && data.error) {
        // API error
        assistantContent = `Sorry, there was an error processing your request: ${data.error}`;
      } else if (!data.hasResults) {
        // No results found (A3 flow)
        assistantContent =
          data.answer || "I couldn't find any knowledge matching your query.";

        if (data.suggestions && data.suggestions.length > 0) {
          assistantContent +=
            "\n\n---\n\n**Suggestions(If didn't find what you were looking for):**\n\n";
          data.suggestions.forEach((suggestion: string) => {
            assistantContent += `- ${suggestion}\n`;
          });
          assistantContent +=
            "\nYou can also try browsing the Knowledge Repository or contribute your own knowledge (if registered).";
        }
      } else {
        // Success with results
        assistantContent = data.answer;
      }

      // Map API results to sources
      const sources: SearchSource[] =
        data.results?.map(
          (result: {
            id: string;
            source: string;
            content: string;
            validityScore: number;
            created_at?: string;
          }) => ({
            id: result.id,
            title: result.source,
            content: result.content,
            validityScore: result.validityScore,
            createdAt: result.created_at || new Date().toISOString(),
          })
        ) || [];

      // Use historyId from API response if available, otherwise generate UUID
      const messageId = data.historyId || crypto.randomUUID();

      const assistantMessage: Message = {
        id: messageId,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        sources: data.hasResults ? sources : undefined,
        relatedTopics: data.relatedTopics,
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
      };

      setActiveConversation(finalConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation!.id ? finalConversation : c))
      );
    } catch (error) {
      console.error("Search error:", error);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I encountered an error while searching. Please try again.",
        timestamp: new Date(),
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
      };

      setActiveConversation(finalConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation!.id ? finalConversation : c))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  const handleDeleteConversation = async (id: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation? All search history will be lost and cannot be recovered."
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("Deleting conversation:", id);

      // Call API to delete from database
      const response = await fetch(`/api/chat?chatId=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      console.log("Delete response:", data);

      if (data.success) {
        // Remove from local state
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversation?.id === id) {
          setActiveConversation(null);
        }
      } else {
        console.error("Delete failed:", data.error);
        alert(`Failed to delete conversation: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("An error occurred while deleting the conversation.");
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;

    const newFavoriteState = !conversation.isFavorite;

    try {
      // Update in database
      const response = await fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: id,
          isFavorite: newFavoriteState,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, isFavorite: newFavoriteState } : c
          )
        );
        if (activeConversation?.id === id) {
          setActiveConversation({
            ...activeConversation,
            isFavorite: newFavoriteState,
          });
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Handle feedback submission
  const handleFeedback = async (
    messageId: string,
    type: "positive" | "negative"
  ) => {
    try {
      console.log("[SearchPage] handleFeedback called:", {
        messageId,
        type,
        currentConversation: activeConversation?.id,
      });

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          chatId: activeConversation?.id,
          feedbackType: type,
          profileId: user?.id,
        }),
      });

      const result = await response.json();
      console.log("[SearchPage] API response:", result);

      // Update message feedback state locally
      if (activeConversation) {
        console.log("[SearchPage] Updating local state to:", type);
        const updatedMessages = activeConversation.messages.map((msg) =>
          msg.id === messageId ? { ...msg, feedback: type } : msg
        );
        const updatedConversation = {
          ...activeConversation,
          messages: updatedMessages,
        };
        setActiveConversation(updatedConversation);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id ? updatedConversation : c
          )
        );
        console.log(
          "[SearchPage] State updated, new feedback:",
          updatedMessages.find((m) => m.id === messageId)?.feedback
        );
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  // Handle canceling feedback
  const handleCancelFeedback = async (messageId: string) => {
    try {
      console.log(
        `[Cancel Feedback] Calling DELETE for messageId: ${messageId}, profileId: ${user?.id}`
      );

      const response = await fetch(
        `/api/feedback?messageId=${messageId}&profileId=${user?.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      console.log(`[Cancel Feedback] DELETE response:`, result);

      // Update message feedback state locally
      if (activeConversation) {
        const updatedMessages = activeConversation.messages.map((msg) =>
          msg.id === messageId ? { ...msg, feedback: null } : msg
        );
        const updatedConversation = {
          ...activeConversation,
          messages: updatedMessages,
        };
        setActiveConversation(updatedConversation);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id ? updatedConversation : c
          )
        );
      }
    } catch (error) {
      console.error("Error canceling feedback:", error);
    }
  };

  // Filter conversations based on search query and favorites
  const filteredConversations = conversations.filter((conv) => {
    // Filter by favorites first
    if (showFavoritesOnly && !conv.isFavorite) {
      return false;
    }

    // Then filter by search query if active
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      // Search in conversation title
      if (conv.title.toLowerCase().includes(query)) {
        return true;
      }
      // Search in message content
      return conv.messages.some((msg) =>
        msg.content.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleToggleSearch = () => {
    setIsSearchActive(!isSearchActive);
    if (isSearchActive) {
      setSearchQuery(""); // Clear search when closing
    }
  };

  return (
    <div className={`flex h-screen ${bgColor} transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        conversations={user ? filteredConversations : []}
        activeConversation={activeConversation}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onToggleFavorite={handleToggleFavorite}
        isLoggedIn={!!user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchActive={isSearchActive}
        onToggleSearch={handleToggleSearch}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
      />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header with navigation */}
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            {/* Expand sidebar button - only show when collapsed */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`mr-4 flex h-12 w-12 items-center justify-center rounded-lg ${mutedTextColor} ${hoverBg} hover:${textColor}`}
                title="Open sidebar"
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
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}

            {/* Title with navigation links */}
            <div className="flex items-center gap-8">
              <span className={`text-lg font-medium ${textColor}`}>
                Wisdom Search
              </span>

              {/* Navigation Links */}
              <nav className="flex items-center gap-6">
                <button className="text-base text-teal-400 font-medium">
                  Search
                </button>
                <a
                  href={NAV_URLS.CLOUD}
                  className={`text-base ${mutedTextColor} hover:${textColor}`}
                >
                  Cloud
                </a>
                <a
                  href={NAV_URLS.EXPLORE}
                  className={`text-base ${mutedTextColor} hover:${textColor}`}
                >
                  Explore
                </a>
              </nav>
            </div>
          </div>

          {/* Theme Toggle and User Menu/Sign In Button */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <UserMenu
                email={profile?.email || user.email || ""}
                name={profile?.name}
              />
            ) : (
              <a
                href="/login"
                className={`rounded-full border ${
                  isDark
                    ? "border-gray-600 text-gray-300 hover:border-teal-400 hover:text-white"
                    : "border-gray-400 text-gray-700 hover:border-teal-500 hover:text-gray-900"
                } px-5 py-2 text-base transition-colors`}
              >
                Sign in
              </a>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={handleSendMessage} />
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-8">
              {activeConversation.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRelatedTopicClick={handleSendMessage}
                  onFeedback={handleFeedback}
                  onCancelFeedback={handleCancelFeedback}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Only show after first message */}
        {activeConversation && activeConversation.messages.length > 0 && (
          <div
            className={`border-t ${borderColor} ${bgColor} p-4 transition-colors duration-300`}
          >
            <div className="mx-auto max-w-3xl">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
