"use client";

import { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import WelcomeScreen from "./WelcomeScreen";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import { useTheme } from "../context/ThemeContext";
import type { User } from "@supabase/supabase-js";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
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

    // Simulate API response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I found some interesting results for "${content}". Here's what I discovered:\n\n• **Result 1**: This is a sample search result that matches your query.\n• **Result 2**: Another relevant finding from Wisdom Island.\n• **Result 3**: Additional information that might be helpful.\n\nWould you like me to elaborate on any of these findings?`,
        timestamp: new Date(),
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
      };

      setActiveConversation(finalConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation!.id ? finalConversation : c))
      );
      setIsLoading(false);
    }, 1500);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
    }
  };

  return (
    <div className={`flex h-screen ${bgColor} transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        conversations={user ? conversations : []}
        activeConversation={activeConversation}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoggedIn={!!user}
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

          {/* User Menu or Sign In Button */}
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

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={handleSendMessage} />
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-8">
              {activeConversation.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
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
