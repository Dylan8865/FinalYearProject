"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { BlockType } from "@/types/types";

interface BlockMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  filterText?: string;
}

interface BlockTypeOption {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  keywords: string[]; // For search filtering
  shortcut?: string; // e.g., "/h1" triggers heading_1
  category: "text" | "list" | "media" | "advanced";
}

const blockTypeOptions: BlockTypeOption[] = [
  // Text blocks
  {
    type: "paragraph",
    label: "Text",
    description: "Just start writing with plain text",
    icon: "📝",
    keywords: ["text", "paragraph", "p"],
    shortcut: "/text",
    category: "text",
  },
  {
    type: "heading_1",
    label: "Heading 1",
    description: "Big section heading",
    icon: "H1",
    keywords: ["heading", "h1", "title", "big"],
    shortcut: "/h1",
    category: "text",
  },
  {
    type: "heading_2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: "H2",
    keywords: ["heading", "h2", "subtitle"],
    shortcut: "/h2",
    category: "text",
  },
  {
    type: "heading_3",
    label: "Heading 3",
    description: "Small section heading",
    icon: "H3",
    keywords: ["heading", "h3", "small"],
    shortcut: "/h3",
    category: "text",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Capture a quote",
    icon: '"',
    keywords: ["quote", "blockquote", "citation"],
    shortcut: "/quote",
    category: "text",
  },
  {
    type: "callout",
    label: "Callout",
    description: "Make writing stand out",
    icon: "💡",
    keywords: ["callout", "note", "tip", "warning", "info"],
    shortcut: "/callout",
    category: "text",
  },
  {
    type: "code",
    label: "Code",
    description: "Capture a code snippet",
    icon: "</>",
    keywords: ["code", "snippet", "programming"],
    shortcut: "/code",
    category: "text",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visually divide content",
    icon: "─",
    keywords: ["divider", "separator", "hr", "line"],
    shortcut: "/divider",
    category: "text",
  },

  // List blocks
  {
    type: "bulleted_list",
    label: "Bulleted List",
    description: "Create a simple bullet list",
    icon: "•",
    keywords: ["bullet", "list", "ul", "unordered"],
    shortcut: "/bullet",
    category: "list",
  },
  {
    type: "todo",
    label: "To-do List",
    description: "Track tasks with a to-do list",
    icon: "☑",
    keywords: ["todo", "task", "checkbox", "check"],
    shortcut: "/todo",
    category: "list",
  },
  {
    type: "toggle",
    label: "Toggle List",
    description: "Toggles can hide and show content",
    icon: "▶",
    keywords: ["toggle", "collapse", "expand", "accordion"],
    shortcut: "/toggle",
    category: "list",
  },

  // Media blocks
  {
    type: "image",
    label: "Image",
    description: "Upload or embed an image",
    icon: "🖼️",
    keywords: ["image", "picture", "photo", "img"],
    shortcut: "/img",
    category: "media",
  },

  // Advanced blocks
  {
    type: "bookmark",
    label: "Bookmark",
    description: "Save a link as a visual bookmark",
    icon: "🔖",
    keywords: ["bookmark", "link", "url"],
    shortcut: "/bookmark",
    category: "advanced",
  },
];

const categoryLabels: Record<string, string> = {
  text: "Text",
  list: "Lists",
  media: "Media",
  advanced: "Advanced",
};

const BlockMenu = ({
  isOpen,
  position,
  onSelect,
  onClose,
  filterText = "",
}: BlockMenuProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState(filterText);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter blocks based on search query
  const filteredBlocks = blockTypeOptions.filter((block) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase().replace("/", "");
    return (
      block.label.toLowerCase().includes(query) ||
      block.description.toLowerCase().includes(query) ||
      block.keywords.some((k) => k.includes(query)) ||
      block.shortcut?.toLowerCase().includes("/" + query)
    );
  });

  // Group filtered blocks by category
  const groupedBlocks = filteredBlocks.reduce(
    (acc, block) => {
      if (!acc[block.category]) {
        acc[block.category] = [];
      }
      acc[block.category].push(block);
      return acc;
    },
    {} as Record<string, BlockTypeOption[]>
  );

  // Check for exact shortcut match
  const exactMatch = blockTypeOptions.find(
    (block) => block.shortcut?.toLowerCase() === searchQuery.toLowerCase()
  );

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Update search query when filterText prop changes
  useEffect(() => {
    setSearchQuery(filterText);
  }, [filterText]);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the menu is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredBlocks.length - 1 ? prev + 1 : prev
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case "Enter":
          e.preventDefault();
          if (exactMatch) {
            onSelect(exactMatch.type);
          } else if (filteredBlocks[selectedIndex]) {
            onSelect(filteredBlocks[selectedIndex].type);
          }
          break;

        case "Escape":
          e.preventDefault();
          onClose();
          break;

        case "Tab":
          e.preventDefault();
          // Tab moves selection down, Shift+Tab moves up
          if (e.shiftKey) {
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          } else {
            setSelectedIndex((prev) =>
              prev < filteredBlocks.length - 1 ? prev + 1 : prev
            );
          }
          break;
      }
    },
    [filteredBlocks, selectedIndex, exactMatch, onSelect, onClose]
  );

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-2xl"
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="border-b border-gray-700 px-3 py-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Filter blocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-500"
        />
      </div>

      {/* Block list */}
      <div className="max-h-72 overflow-y-auto py-2">
        {Object.entries(groupedBlocks).length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-gray-500">
            No blocks found
          </div>
        ) : (
          Object.entries(groupedBlocks).map(([category, blocks]) => (
            <div key={category} className="mb-2 last:mb-0">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-gray-500">
                {categoryLabels[category] || category}
              </div>
              {blocks.map((block) => {
                const globalIndex = filteredBlocks.indexOf(block);
                const isSelected = globalIndex === selectedIndex;

                return (
                  <button
                    key={block.type}
                    onClick={() => onSelect(block.type)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-800 text-sm">
                      {block.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{block.label}</span>
                        {block.shortcut && (
                          <span
                            className={`text-xs ${
                              isSelected ? "text-blue-200" : "text-gray-500"
                            }`}
                          >
                            {block.shortcut}
                          </span>
                        )}
                      </div>
                      <p
                        className={`truncate text-xs ${
                          isSelected ? "text-blue-200" : "text-gray-500"
                        }`}
                      >
                        {block.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-gray-700 px-3 py-2">
        <p className="text-xs text-gray-500">
          ↑↓ to navigate • Enter to select • Esc to close
        </p>
      </div>
    </div>
  );
};

export default BlockMenu;
