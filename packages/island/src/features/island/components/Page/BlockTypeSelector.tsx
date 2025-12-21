import React, { useState, useRef, useEffect } from "react";
import { BlockType } from "@/types/types";

interface BlockTypeSelectorProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

interface BlockTypeOption {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  category: "basic" | "media" | "advanced";
}

const blockTypes: BlockTypeOption[] = [
  // Basic
  {
    type: "paragraph",
    label: "Text",
    description: "Plain text paragraph",
    icon: "📝",
    category: "basic",
  },
  {
    type: "heading_1",
    label: "Heading 1",
    description: "Large section heading",
    icon: "H1",
    category: "basic",
  },
  {
    type: "heading_2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: "H2",
    category: "basic",
  },
  {
    type: "heading_3",
    label: "Heading 3",
    description: "Small section heading",
    icon: "H3",
    category: "basic",
  },
  {
    type: "bulleted_list",
    label: "Bulleted List",
    description: "Simple bullet list",
    icon: "•",
    category: "basic",
  },
  {
    type: "numbered_list",
    label: "Numbered List",
    description: "Ordered list with numbers",
    icon: "1.",
    category: "basic",
  },
  {
    type: "todo",
    label: "To-do",
    description: "Track tasks with checkboxes",
    icon: "☑",
    category: "basic",
  },
  {
    type: "toggle",
    label: "Toggle",
    description: "Collapsible content",
    icon: "▶",
    category: "basic",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Highlight a quote",
    icon: '"',
    category: "basic",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visual separator",
    icon: "─",
    category: "basic",
  },
  {
    type: "callout",
    label: "Callout",
    description: "Important note or tip",
    icon: "💡",
    category: "basic",
  },
  {
    type: "code",
    label: "Code",
    description: "Code snippet with syntax",
    icon: "</>",
    category: "basic",
  },

  // Media
  {
    type: "image",
    label: "Image",
    description: "Upload or embed image",
    icon: "🖼️",
    category: "media",
  },
  {
    type: "video",
    label: "Video",
    description: "Embed video file",
    icon: "🎥",
    category: "media",
  },
  {
    type: "audio",
    label: "Audio",
    description: "Embed audio file",
    icon: "🎵",
    category: "media",
  },
  {
    type: "file",
    label: "File",
    description: "Upload any file",
    icon: "📎",
    category: "media",
  },

  // Advanced
  {
    type: "bookmark",
    label: "Bookmark",
    description: "Save a web link",
    icon: "🔖",
    category: "advanced",
  },
];

const BlockTypeSelector = ({
  onSelect,
  onClose,
  position,
}: BlockTypeSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredBlocks = blockTypes.filter(
    (block) =>
      block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredBlocks.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredBlocks[selectedIndex]) {
        onSelect(filteredBlocks[selectedIndex].type);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

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

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-80 rounded-lg border border-gray-700 bg-gray-900 shadow-2xl"
      style={
        position
          ? { top: position.y, left: position.x }
          : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
      }
    >
      {/* Search input */}
      <div className="border-b border-gray-700 p-3">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search for a block type..."
          className="w-full bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-500"
        />
      </div>

      {/* Block type list */}
      <div className="max-h-96 overflow-y-auto p-2">
        {Object.entries(groupedBlocks).map(([category, blocks]) => (
          <div key={category} className="mb-4 last:mb-0">
            <p className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">
              {category}
            </p>
            <div className="space-y-1">
              {blocks.map((block, index) => {
                const globalIndex = filteredBlocks.indexOf(block);
                return (
                  <button
                    key={block.type}
                    onClick={() => onSelect(block.type)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                      selectedIndex === globalIndex
                        ? "bg-blue-600 text-white"
                        : "text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{block.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{block.label}</p>
                        <p
                          className={`text-xs ${
                            selectedIndex === globalIndex
                              ? "text-blue-200"
                              : "text-gray-500"
                          }`}
                        >
                          {block.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filteredBlocks.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No blocks found
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockTypeSelector;
