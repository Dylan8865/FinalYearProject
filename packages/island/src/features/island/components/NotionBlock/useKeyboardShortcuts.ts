"use client";

import { useCallback, useEffect, useRef } from "react";
import { ItemDataType } from "@/types/types";
import { BlockEditor } from "./useBlockEditor";
import { FocusManager } from "./useFocusManager";

interface UseKeyboardShortcutsOptions {
  blockEditor: BlockEditor;
  focusManager: FocusManager;
  onSlashCommand?: (blockId: string) => void;
  onBlockMenuOpen?: (blockId: string) => void;
  enabled?: boolean;
}

type KeyHandler = (
  event: KeyboardEvent,
  blockId: string,
  block: ItemDataType
) => void | Promise<void>;

/**
 * useKeyboardShortcuts Hook
 *
 * Handles keyboard navigation and shortcuts:
 * - Enter: Create new block
 * - Backspace: Delete/merge blocks
 * - Tab/Shift+Tab: Indent/outdent
 * - Cmd/Ctrl+D: Duplicate
 * - Arrow keys: Navigate between blocks
 * - Slash command detection
 */
export const useKeyboardShortcuts = ({
  blockEditor,
  focusManager,
  onSlashCommand,
  onBlockMenuOpen,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const {
    blocks,
    focusedBlockId,
    createBlock,
    deleteBlock,
    duplicateBlock,
    moveBlockUp,
    moveBlockDown,
    mergeWithPreviousBlock,
    setFocusedBlockId,
    focusNextBlock,
    focusPreviousBlock,
    undo,
    redo,
  } = blockEditor;

  const {
    isCursorAtStart,
    isCursorAtEnd,
    focusBlockAtEnd,
    focusBlockAtStart,
    getCursorPosition,
  } = focusManager;

  const isProcessingRef = useRef(false);

  // Get current block content
  const getBlockContent = useCallback(
    (blockId: string): string => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return "";
      return typeof block.content === "string" ? block.content : "";
    },
    [blocks]
  );

  // Handle Enter key - create new block
  const handleEnter = useCallback(
    async (event: KeyboardEvent, blockId: string) => {
      if (event.shiftKey) return; // Allow Shift+Enter for line breaks

      event.preventDefault();

      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        await createBlock(blockId, "paragraph");
      } finally {
        isProcessingRef.current = false;
      }
    },
    [createBlock]
  );

  // Handle Backspace - delete or merge blocks
  const handleBackspace = useCallback(
    async (event: KeyboardEvent, blockId: string) => {
      const content = getBlockContent(blockId);
      const cursorAtStart = isCursorAtStart(blockId);

      // Only handle if cursor is at start of block
      if (!cursorAtStart) return;

      event.preventDefault();

      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        if (content === "" || content.trim() === "") {
          // Empty block - delete it
          await deleteBlock(blockId);
        } else {
          // Non-empty block - try to merge with previous
          const result = await mergeWithPreviousBlock(blockId);
          if (result) {
            // Focus the merged block at the merge point
            setTimeout(() => {
              focusManager.focusBlock(result.blockId, result.cursorPosition);
            }, 50);
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    },
    [
      getBlockContent,
      isCursorAtStart,
      deleteBlock,
      mergeWithPreviousBlock,
      focusManager,
    ]
  );

  // Handle Tab - indent block (for future nesting support)
  const handleTab = useCallback((event: KeyboardEvent, blockId: string) => {
    event.preventDefault();

    // For now, just insert spaces or handle indentation
    // Full nesting support would require parent_id management
    console.log("Tab pressed - indent support coming soon");
  }, []);

  // Handle Shift+Tab - outdent block
  const handleShiftTab = useCallback(
    (event: KeyboardEvent, blockId: string) => {
      event.preventDefault();

      // For now, just handle outdentation
      console.log("Shift+Tab pressed - outdent support coming soon");
    },
    []
  );

  // Handle Cmd/Ctrl+D - duplicate block
  const handleDuplicate = useCallback(
    async (event: KeyboardEvent, blockId: string) => {
      event.preventDefault();

      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        await duplicateBlock(blockId);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [duplicateBlock]
  );

  // Handle Arrow Up - move focus to previous block
  const handleArrowUp = useCallback(
    (event: KeyboardEvent, blockId: string) => {
      const cursorAtStart = isCursorAtStart(blockId);

      if (cursorAtStart) {
        event.preventDefault();

        const blockIndex = blocks.findIndex((b) => b.id === blockId);
        if (blockIndex > 0) {
          const prevBlock = blocks[blockIndex - 1];
          focusBlockAtEnd(prevBlock.id);
        }
      }
    },
    [blocks, isCursorAtStart, focusBlockAtEnd]
  );

  // Handle Arrow Down - move focus to next block
  const handleArrowDown = useCallback(
    (event: KeyboardEvent, blockId: string) => {
      const cursorAtEnd = isCursorAtEnd(blockId);

      if (cursorAtEnd) {
        event.preventDefault();

        const blockIndex = blocks.findIndex((b) => b.id === blockId);
        if (blockIndex < blocks.length - 1) {
          const nextBlock = blocks[blockIndex + 1];
          focusBlockAtStart(nextBlock.id);
        }
      }
    },
    [blocks, isCursorAtEnd, focusBlockAtStart]
  );

  // Handle Slash command
  const handleSlash = useCallback(
    (event: KeyboardEvent, blockId: string) => {
      const content = getBlockContent(blockId);
      const cursorPos = getCursorPosition(blockId);

      // Only trigger slash command if:
      // 1. Block is empty OR
      // 2. Slash is at the start of the line
      if (content === "" || cursorPos === 0) {
        // Don't prevent default - let the "/" character be typed
        // The menu will be shown after the character is inserted
        setTimeout(() => {
          onSlashCommand?.(blockId);
        }, 10);
      }
    },
    [getBlockContent, getCursorPosition, onSlashCommand]
  );

  // Handle Cmd/Ctrl+Shift+ArrowUp - move block up
  const handleMoveUp = useCallback(
    async (event: KeyboardEvent, blockId: string) => {
      event.preventDefault();
      await moveBlockUp(blockId);
    },
    [moveBlockUp]
  );

  // Handle Cmd/Ctrl+Shift+ArrowDown - move block down
  const handleMoveDown = useCallback(
    async (event: KeyboardEvent, blockId: string) => {
      event.preventDefault();
      await moveBlockDown(blockId);
    },
    [moveBlockDown]
  );

  // Main keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !focusedBlockId) return;

      const block = blocks.find((b) => b.id === focusedBlockId);
      if (!block) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      switch (event.key) {
        case "Enter":
          handleEnter(event, focusedBlockId);
          break;

        case "Backspace":
          handleBackspace(event, focusedBlockId);
          break;

        case "Tab":
          if (event.shiftKey) {
            handleShiftTab(event, focusedBlockId);
          } else {
            handleTab(event, focusedBlockId);
          }
          break;

        case "d":
        case "D":
          if (cmdOrCtrl) {
            handleDuplicate(event, focusedBlockId);
          }
          break;

        case "ArrowUp":
          if (cmdOrCtrl && event.shiftKey) {
            handleMoveUp(event, focusedBlockId);
          } else {
            handleArrowUp(event, focusedBlockId);
          }
          break;

        case "ArrowDown":
          if (cmdOrCtrl && event.shiftKey) {
            handleMoveDown(event, focusedBlockId);
          } else {
            handleArrowDown(event, focusedBlockId);
          }
          break;

        case "/":
          handleSlash(event, focusedBlockId);
          break;

        case "z":
        case "Z":
          if (cmdOrCtrl) {
            event.preventDefault();
            undo();
          }
          break;

        case "y":
        case "Y":
          if (cmdOrCtrl) {
            event.preventDefault();
            redo();
          }
          break;

        case "Escape":
          // Clear focus or close any open menus
          setFocusedBlockId(null);
          break;
      }
    },
    [
      enabled,
      focusedBlockId,
      blocks,
      handleEnter,
      handleBackspace,
      handleTab,
      handleShiftTab,
      handleDuplicate,
      handleArrowUp,
      handleArrowDown,
      handleMoveUp,
      handleMoveDown,
      handleSlash,
      setFocusedBlockId,
    ]
  );

  // Attach global keyboard listener
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    // Expose handlers for manual use if needed
    handleEnter,
    handleBackspace,
    handleTab,
    handleShiftTab,
    handleDuplicate,
    handleArrowUp,
    handleArrowDown,
    handleSlash,
  };
};

export type KeyboardShortcuts = ReturnType<typeof useKeyboardShortcuts>;
