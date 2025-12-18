"use client";

import React, { useState, useRef, useEffect } from "react";
import { BlockType, ItemDataType } from "@/types/types";
import AddIcon from "@/icons/AddIcon";
import DragIcon from "@/icons/DragIcon";

interface BlockActionsProps {
  block: ItemDataType;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onConvertType: (type: BlockType) => void;
  onAddBlockBefore: () => void;
  onAddBlockAfter: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
}

const convertibleTypes: { type: BlockType; label: string; icon: string }[] = [
  { type: "paragraph", label: "Text", icon: "📝" },
  { type: "heading_1", label: "Heading 1", icon: "H1" },
  { type: "heading_2", label: "Heading 2", icon: "H2" },
  { type: "heading_3", label: "Heading 3", icon: "H3" },
  { type: "bulleted_list", label: "Bulleted List", icon: "•" },
  { type: "numbered_list", label: "Numbered List", icon: "1." },
  { type: "todo", label: "To-do", icon: "☑" },
  { type: "quote", label: "Quote", icon: '"' },
  { type: "callout", label: "Callout", icon: "💡" },
  { type: "code", label: "Code", icon: "</>" },
];

const colorOptions = [
  { value: "bg-gray-800/30", label: "Default", preview: "bg-gray-600" },
  { value: "bg-red-900/30", label: "Red", preview: "bg-red-500" },
  { value: "bg-orange-900/30", label: "Orange", preview: "bg-orange-500" },
  { value: "bg-yellow-900/30", label: "Yellow", preview: "bg-yellow-500" },
  { value: "bg-green-900/30", label: "Green", preview: "bg-green-500" },
  { value: "bg-blue-900/30", label: "Blue", preview: "bg-blue-500" },
  { value: "bg-purple-900/30", label: "Purple", preview: "bg-purple-500" },
  { value: "bg-pink-900/30", label: "Pink", preview: "bg-pink-500" },
];

const BlockActions = ({
  block,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onConvertType,
  onAddBlockBefore,
  onAddBlockAfter,
  isFirst = false,
  isLast = false,
  className = "",
}: BlockActionsProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTurnInto, setShowTurnInto] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowTurnInto(false);
        setShowColorPicker(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
    setShowTurnInto(false);
    setShowColorPicker(false);
  };

  return (
    <div
      className={`relative flex items-center gap-0.5 ${className}`}
      ref={menuRef}
    >
      {/* Add Block Button */}
      <button
        onClick={onAddBlockAfter}
        className="rounded p-1 text-gray-500 opacity-0 transition-all hover:bg-gray-700 hover:text-gray-300 group-hover:opacity-100"
        title="Add block below"
      >
        <AddIcon />
      </button>

      {/* Drag Handle / Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="cursor-grab rounded p-1 text-gray-500 opacity-0 transition-all hover:bg-gray-700 hover:text-gray-300 active:cursor-grabbing group-hover:opacity-100"
        title="Drag to move / Click for options"
      >
        <DragIcon />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
          {/* Delete */}
          <button
            onClick={() => handleAction(onDelete)}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800"
          >
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Delete</span>
            <span className="ml-auto text-xs text-gray-500">Backspace</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={() => handleAction(onDuplicate)}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800"
          >
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Duplicate</span>
            <span className="ml-auto text-xs text-gray-500">⌘D</span>
          </button>

          <div className="my-1 border-t border-gray-700" />

          {/* Turn into */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTurnInto(!showTurnInto);
                setShowColorPicker(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800"
            >
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Turn into</span>
              <svg
                className="ml-auto h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Turn into submenu */}
            {showTurnInto && (
              <div className="absolute left-full top-0 ml-1 min-w-[180px] rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
                {convertibleTypes.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleAction(() => onConvertType(item.type))}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                      block.type === item.type
                        ? "bg-blue-600/20 text-blue-400"
                        : "text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    <span className="w-6 text-center">{item.icon}</span>
                    <span>{item.label}</span>
                    {block.type === item.type && (
                      <svg
                        className="ml-auto h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="my-1 border-t border-gray-700" />

          {/* Move up */}
          <button
            onClick={() => handleAction(onMoveUp)}
            disabled={isFirst}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
              isFirst
                ? "cursor-not-allowed text-gray-600"
                : "text-gray-200 hover:bg-gray-800"
            }`}
          >
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            <span>Move up</span>
            <span className="ml-auto text-xs text-gray-500">⌘⇧↑</span>
          </button>

          {/* Move down */}
          <button
            onClick={() => handleAction(onMoveDown)}
            disabled={isLast}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
              isLast
                ? "cursor-not-allowed text-gray-600"
                : "text-gray-200 hover:bg-gray-800"
            }`}
          >
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <span>Move down</span>
            <span className="ml-auto text-xs text-gray-500">⌘⇧↓</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BlockActions;
