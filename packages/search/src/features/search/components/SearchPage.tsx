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
}

interface SearchPageProps {
  user: User | null;
}

export default function SearchPage({ user }: SearchPageProps) {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
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
            data.chats.map(async (chat: { id: string; title: string; created_at: string }) => {
              const historyResponse = await fetch(`/api/history?chatId=${chat.id}`);
              const historyData = await historyResponse.json();

              const messages: Message[] = [];
              
              if (historyData.success && historyData.history) {
                historyData.history.forEach((entry: { 
                  prompt_text: string; 
                  result_text: string; 
                  created_at: string;
                }) => {
                  // Add user message
                  messages.push({
                    id: crypto.randomUUID(),
                    role: "user",
                    content: entry.prompt_text,
                    timestamp: new Date(entry.created_at),
                  });
                  
                  // Add assistant message
                  messages.push({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: entry.result_text,
                    timestamp: new Date(entry.created_at),
                  });
                });
              }

              return {
                id: chat.id,
                title: chat.title,
                messages,
                createdAt: new Date(chat.created_at),
              };
            })
          );

          setConversations(loadedConversations);
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

    // Log search analytics (non-blocking)
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "search",
        profileId: user?.id,
        chatId: conversation.id,
        query: content,
      }),
    }).catch(() => {}); // Ignore analytics errors

    // Call search API
    try {
      const searchPayload = { 
        query: content,
        chatId: conversation.id,
        userId: user?.id,
        promptOrder: conversation.messages.length
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
        assistantContent = data.answer || "I couldn't find any knowledge matching your query.";
        
        if (data.suggestions && data.suggestions.length > 0) {
          assistantContent += "\n\n---\n\n**Suggestions(If didn't find what you were looking for):**\n\n";
          data.suggestions.forEach((suggestion: string) => {
            assistantContent += `- ${suggestion}\n`;
          });
          assistantContent += "\nYou can also try browsing the Knowledge Repository or contribute your own knowledge (if registered).";
        }
      } else {
        // Success with results
        assistantContent = data.answer;
      }

      // Map API results to sources
      const sources: SearchSource[] = data.results?.map((result: { id: string; source: string; content: string; validityScore: number; created_at?: string }) => ({
        id: result.id,
        title: result.source,
        content: result.content,
        validityScore: result.validityScore,
        createdAt: result.created_at || new Date().toISOString(),
      })) || [];

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
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
        content: "Sorry, I encountered an error while searching. Please try again.",
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

  // Handle feedback submission
  const handleFeedback = async (messageId: string, type: "positive" | "negative") => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          chatId: activeConversation?.id,
          feedbackType: type,
          profileId: user?.id,
        }),
      });

      // Update message feedback state locally
      if (activeConversation) {
        const updatedMessages = activeConversation.messages.map((msg) =>
          msg.id === messageId ? { ...msg, feedback: type } : msg
        );
        const updatedConversation = { ...activeConversation, messages: updatedMessages };
        setActiveConversation(updatedConversation);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversation.id ? updatedConversation : c))
        );
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  // Handle report submission
  const handleReport = async (messageId: string, reason: string, details?: string) => {
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          chatId: activeConversation?.id,
          reason,
          details,
          profileId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Could show a toast notification here
        console.log("Report submitted successfully");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) => {
        const query = searchQuery.toLowerCase();
        // Search in conversation title
        if (conv.title.toLowerCase().includes(query)) {
          return true;
        }
        // Search in message content
        return conv.messages.some((msg) =>
          msg.content.toLowerCase().includes(query)
        );
      })
    : conversations;

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
        isLoggedIn={!!user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchActive={isSearchActive}
        onToggleSearch={handleToggleSearch}
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
              <span className={`text-lg font-medium ${textColor}`}>Wisdom Search</span>
              
              {/* Navigation Links */}
              <nav className="flex items-center gap-6">
                <a
                  href="/search"
                  className="text-base text-teal-400 hover:text-teal-300"
                >
                  Search
                </a>
                <a
                  href="/cloud"
                  className={`text-base ${mutedTextColor} hover:${textColor}`}
                >
                  Cloud
                </a>
                <a
                  href="/explore"
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
              <UserMenu email={user.email || ""} />
            ) : (
              <a
                href="/login"
                className={`rounded-full border ${isDark ? "border-gray-600 text-gray-300 hover:border-teal-400 hover:text-white" : "border-gray-400 text-gray-700 hover:border-teal-500 hover:text-gray-900"} px-5 py-2 text-base transition-colors`}
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
                  onReport={handleReport}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Only show after first message */}
        {activeConversation && activeConversation.messages.length > 0 && (
          <div className={`border-t ${borderColor} ${bgColor} p-4 transition-colors duration-300`}>
            <div className="mx-auto max-w-3xl">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
