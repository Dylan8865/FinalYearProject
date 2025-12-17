"use client";

import React, { useRef, useCallback, useState } from "react";
import { ItemDataType, BlockType, BlockProperties } from "@/types/types";
import BlockActions from "./BlockActions";

interface BlockWrapperProps {
  block: ItemDataType;
  children: React.ReactNode;
  onUpdate: (id: string, content: any, properties?: BlockProperties) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onConvertType: (id: string, type: BlockType) => void;
  onAddBlock: (afterId: string | null, type: BlockType) => void;
  onFocus: (id: string) => void;
  registerRef: (id: string, element: HTMLElement | null) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (id: string, position: "before" | "after") => void;
  isFocused?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  dragPosition?: "before" | "after";
  depth?: number;
}

/**
 * BlockWrapper Component
 *
 * Wraps each block with:
 * - Hover actions menu
 * - Drag handle
 * - Focus indicator
 * - Drag & drop support
 */
const BlockWrapper = ({
  block,
  children,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onConvertType,
  onAddBlock,
  onFocus,
  registerRef,
  onDragStart,
  onDragEnd,
  onDragOver,
  isFocused = false,
  isFirst = false,
  isLast = false,
  isDragging = false,
  isDragOver = false,
  dragPosition,
  depth = 0,
}: BlockWrapperProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<"before" | "after">("after");

  // Register the ref for focus management
  const setRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (element) {
        registerRef(block.id, element);
      }
    },
    [block.id, registerRef]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", block.id);
      e.dataTransfer.effectAllowed = "move";
      onDragStart?.(block.id);

      // Add visual feedback
      if (wrapperRef.current) {
        wrapperRef.current.style.opacity = "0.5";
      }
    },
    [block.id, onDragStart]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      onDragEnd?.();

      // Reset visual feedback
      if (wrapperRef.current) {
        wrapperRef.current.style.opacity = "1";
      }
    },
    [onDragEnd]
  );

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (!wrapperRef.current) return;

      // Determine if dropping before or after based on mouse position
      const rect = wrapperRef.current.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? "before" : "after";

      setIsDraggedOver(true);
      setDropPosition(position);
      onDragOver?.(block.id, position);
    },
    [block.id, onDragOver]
  );

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set to false if we're leaving the wrapper entirely
    if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
      setIsDraggedOver(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);

    // The actual reordering is handled by the parent component
    // through onDragOver and onDragEnd
  }, []);

  // Handle focus when clicking on the block
  const handleFocus = useCallback(() => {
    onFocus(block.id);
  }, [block.id, onFocus]);

  return (
    <div
      ref={(el) => {
        (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current =
          el;
        setRef(el);
      }}
      className={`group relative ${isDragging ? "opacity-50" : ""}`}
      style={{ paddingLeft: depth > 0 ? `${depth * 1.5}rem` : 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={handleFocus}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator - before */}
      {isDraggedOver && dropPosition === "before" && (
        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500" />
      )}

      {/* Focus indicator */}
      {isFocused && (
        <div className="pointer-events-none absolute inset-y-0 -left-1 w-0.5 rounded-full bg-blue-500" />
      )}

      {/* Block actions - positioned to the left */}
      <div className="absolute -left-16 top-0 flex items-start pt-1">
        <BlockActions
          block={block}
          onDelete={() => onDelete(block.id)}
          onDuplicate={() => onDuplicate(block.id)}
          onMoveUp={() => onMoveUp(block.id)}
          onMoveDown={() => onMoveDown(block.id)}
          onConvertType={(type) => onConvertType(block.id, type)}
          onAddBlockBefore={() => onAddBlock(null, "paragraph")}
          onAddBlockAfter={() => onAddBlock(block.id, "paragraph")}
          isFirst={isFirst}
          isLast={isLast}
          className={isHovered ? "opacity-100" : "opacity-0"}
        />
      </div>

      {/* Block content */}
      <div className="transition-colors">{children}</div>

      {/* Drop indicator - after */}
      {isDraggedOver && dropPosition === "after" && (
        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500" />
      )}
    </div>
  );
};

export default BlockWrapper;
