"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "system", content: "You are a helpful search assistant." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: trimmed }),
      });

      if (!res.ok) throw new Error("Search API error");

      const data = await res.json();

      const assistant: Message = {
        id: Date.now().toString() + "-a",
        role: "assistant",
        content: formatResults(data.results),
      };

      setMessages((m) => [...m, assistant]);
    } catch (err: any) {
      const errMsg: Message = {
        id: Date.now().toString() + "-e",
        role: "assistant",
        content: err?.message ?? "Unknown error",
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const formatResults = (results: Array<{ title: string; snippet: string; url?: string }>) => {
    if (!results || results.length === 0) return "No results found.";
    return results
      .map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}${r.url ? `\n${r.url}` : ""}`)
      .join("\n\n");
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h1 className="text-lg font-semibold">Search Assistant</h1>
          <p className="text-sm text-gray-500">Ask anything and get quick search-like results.</p>
        </div>

        <div className="p-4 h-[60vh] overflow-auto">
          {messages.map((m) => (
            <div key={m.id} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap ${
                  m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="px-4 py-3 border-t flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search or ask a question..."
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
            aria-label="Search input"
          />
          <button
            onClick={send}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
