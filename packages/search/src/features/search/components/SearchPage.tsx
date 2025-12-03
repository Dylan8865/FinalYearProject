"use client";

import { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import WelcomeScreen from "./WelcomeScreen";
import Sidebar from "./Sidebar";

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

export default function SearchPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        conversations={conversations}
        activeConversation={activeConversation}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 hover:bg-muted"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Wisdom Search</h1>
          <button className="rounded-lg p-2 hover:bg-muted">
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </header>

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

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Wisdom Search can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
