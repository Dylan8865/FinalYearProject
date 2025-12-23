"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { ItemDataType, BlockType, BlockProperties } from "@/types/types";
import BlockRenderer from "./BlockRenderer";
import BlockWrapper from "./BlockWrapper";
import BlockMenu from "./BlockMenu";
import { useBlockEditor, useFocusManager, useKeyboardShortcuts } from ".";
import { useToast } from "../../contexts/ToastContext";

interface BlockEditorContainerProps {
  islandItemId: string;
  initialBlocks: ItemDataType[];
  onRefetch?: () => void;
  onSavingChange?: (isSaving: boolean) => void;
}

/**
 * BlockEditorContainer
 *
 * Main container component that integrates the block editor system with:
 * - Debounced auto-save
 * - Keyboard shortcuts
 * - Focus management
 * - Slash commands
 * - Drag & drop reordering
 */
const BlockEditorContainer = ({
  islandItemId,
  initialBlocks,
  onRefetch,
  onSavingChange,
}: BlockEditorContainerProps) => {
  // Slash command menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [slashFilterText, setSlashFilterText] = useState("");

  // Drag state
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<"before" | "after">("after");

  // Container ref for positioning
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Initialize block editor hook
  const blockEditor = useBlockEditor({
    islandItemId,
    initialBlocks,
    debounceMs: 500,
    onError: (error) => {
      // Logic handled internally by useBlockEditor calling showToast
    },
    onSuccess: (message) => {
      // Logic handled internally by useBlockEditor calling showToast
    },
  });

  // Sync saving state with parent
  useEffect(() => {
    onSavingChange?.(blockEditor.isSaving);
  }, [blockEditor.isSaving, onSavingChange]);

  // Initialize focus manager
  const focusManager = useFocusManager({
    focusedBlockId: blockEditor.focusedBlockId,
    onFocusChange: blockEditor.setFocusedBlockId,
  });

  // Handle slash command
  const handleSlashCommand = useCallback(
    (blockId: string) => {
      const element = focusManager.getBlockElement(blockId);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      setSlashMenuPosition({
        x: rect.left,
        y: rect.bottom + 4,
      });
      setSlashMenuBlockId(blockId);
      setSlashFilterText("");
      setSlashMenuOpen(true);
    },
    [focusManager]
  );

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    blockEditor,
    focusManager,
    onSlashCommand: handleSlashCommand,
    enabled: !slashMenuOpen, // Disable when menu is open
  });

  // Handle slash menu selection
  const handleSlashMenuSelect = useCallback(
    async (type: BlockType) => {
      setSlashMenuOpen(false);

      if (slashMenuBlockId) {
        const block = blockEditor.getBlockById(slashMenuBlockId);
        if (block) {
          const content =
            typeof block.content === "string" ? block.content : "";

          // If block is empty or only has "/", convert it
          if (content === "" || content === "/" || content.startsWith("/")) {
            await blockEditor.convertBlockType(slashMenuBlockId, type);
            // Clear the slash character
            await blockEditor.updateBlock(slashMenuBlockId, "");
          } else {
            // Otherwise create a new block
            await blockEditor.createBlock(slashMenuBlockId, type);
          }
        }
      }

      setSlashMenuBlockId(null);
    },
    [slashMenuBlockId, blockEditor]
  );

  // Handle drag start
  const handleDragStart = useCallback((id: string) => {
    setDraggingBlockId(id);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(async () => {
    if (
      draggingBlockId &&
      dragOverBlockId &&
      draggingBlockId !== dragOverBlockId
    ) {
      await blockEditor.reorderBlocks(
        draggingBlockId,
        dragOverBlockId,
        dragPosition
      );
    }
    setDraggingBlockId(null);
    setDragOverBlockId(null);
  }, [draggingBlockId, dragOverBlockId, dragPosition, blockEditor]);

  // Handle drag over
  const handleDragOver = useCallback(
    (id: string, position: "before" | "after") => {
      setDragOverBlockId(id);
      setDragPosition(position);
    },
    []
  );

  // Organize blocks by parent for nested structure
  const { topLevelBlocks, blockChildren } = useMemo(() => {
    const children: Record<string, ItemDataType[]> = {};
    const topLevel: ItemDataType[] = [];

    blockEditor.blocks.forEach((block) => {
      if (block.parent_id) {
        if (!children[block.parent_id]) {
          children[block.parent_id] = [];
        }
        children[block.parent_id].push(block);
      } else {
        topLevel.push(block);
      }
    });

    // Sort children by order_index
    Object.keys(children).forEach((parentId) => {
      children[parentId].sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      );
    });

    return { topLevelBlocks: topLevel, blockChildren: children };
  }, [blockEditor.blocks]);

  // Render a block and its children recursively
  const renderBlock = useCallback(
    (block: ItemDataType, index: number, depth = 0) => {
      const children = blockChildren[block.id];
      const isFirst = index === 0;
      const isLast = index === topLevelBlocks.length - 1;

      // Render nested children for toggle blocks
      const nestedChildren = children ? (
        <div className="ml-6 mt-1 space-y-1">
          {children.map((child, childIndex) =>
            renderBlock(child, childIndex, depth + 1)
          )}
        </div>
      ) : null;

      return (
        <BlockWrapper
          key={block.id}
          block={block}
          onUpdate={blockEditor.updateBlock}
          onDelete={blockEditor.deleteBlock}
          onDuplicate={blockEditor.duplicateBlock}
          onMoveUp={blockEditor.moveBlockUp}
          onMoveDown={blockEditor.moveBlockDown}
          onConvertType={blockEditor.convertBlockType}
          onAddBlock={blockEditor.createBlock}
          onFocus={blockEditor.setFocusedBlockId}
          registerRef={focusManager.registerBlockRef}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          isFocused={blockEditor.focusedBlockId === block.id}
          isFirst={isFirst}
          isLast={isLast}
          isDragging={draggingBlockId === block.id}
          isDragOver={dragOverBlockId === block.id}
          dragPosition={dragPosition}
          depth={depth}
        >
          <BlockRenderer
            block={block}
            onUpdate={blockEditor.updateBlock}
            onDelete={blockEditor.deleteBlock}
            onAddBlock={(afterId, type) =>
              blockEditor.createBlock(afterId, type)
            }
            onUploadImage={blockEditor.uploadBlockImage}
            onRemoveImage={blockEditor.removeBlockImage}
          >
            {block.type === "toggle" ? nestedChildren : undefined}
          </BlockRenderer>
        </BlockWrapper>
      );
    },
    [
      blockChildren,
      topLevelBlocks,
      blockEditor,
      focusManager,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      draggingBlockId,
      dragOverBlockId,
      dragPosition,
    ]
  );

  // Empty state - show placeholder
  if (topLevelBlocks.length === 0) {
    return (
      <div ref={containerRef} className="relative px-16 py-4">
        <div
          className="cursor-text rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/20 px-4 py-8 text-center"
          onClick={() => blockEditor.createBlock(null, "paragraph")}
        >
          <p className="text-gray-500">
            Step 1. Click here to add block
            <br />
            Step 2. Type{" "}
            <kbd className="rounded bg-gray-700 px-1.5 py-0.5 text-xs">
              /
            </kbd>{" "}
            to select block type
            <br />
            Step 3. Start typing to add content
          </p>
        </div>

        {/* Slash command menu */}
        <BlockMenu
          isOpen={slashMenuOpen}
          position={slashMenuPosition}
          onSelect={handleSlashMenuSelect}
          onClose={() => setSlashMenuOpen(false)}
          filterText={slashFilterText}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative px-16 py-4">
      {/* Saving indicator removed - handled by parent */}

      {/* Block list */}
      <div className="space-y-0.5">
        {topLevelBlocks.map((block, index) => renderBlock(block, index))}
      </div>

      {/* Add block button at the end */}
      <div className="mt-4">
        <button
          onClick={() =>
            blockEditor.createBlock(
              topLevelBlocks[topLevelBlocks.length - 1]?.id || null,
              "paragraph"
            )
          }
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add a block
        </button>
      </div>

      {/* Slash command menu */}
      <BlockMenu
        isOpen={slashMenuOpen}
        position={slashMenuPosition}
        onSelect={handleSlashMenuSelect}
        onClose={() => setSlashMenuOpen(false)}
        filterText={slashFilterText}
      />
    </div>
  );
};

export default BlockEditorContainer;
