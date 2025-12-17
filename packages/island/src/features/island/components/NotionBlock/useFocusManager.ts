"use client";

import { useCallback, useRef, useEffect, MutableRefObject } from "react";

interface UseFocusManagerOptions {
  focusedBlockId: string | null;
  onFocusChange?: (id: string | null) => void;
}

interface BlockRef {
  id: string;
  element: HTMLElement;
}

/**
 * useFocusManager Hook
 *
 * Manages focus state across blocks with:
 * - Cursor position preservation
 * - Smooth focus transitions
 * - Ref management for block elements
 */
export const useFocusManager = ({
  focusedBlockId,
  onFocusChange,
}: UseFocusManagerOptions) => {
  // Map of block IDs to their DOM elements
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Store cursor position when leaving a block
  const cursorPositionRef = useRef<{
    blockId: string;
    position: number;
  } | null>(null);

  // Register a block element
  const registerBlockRef = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) {
        blockRefs.current.set(id, element);
      } else {
        blockRefs.current.delete(id);
      }
    },
    []
  );

  // Get element for a block
  const getBlockElement = useCallback((id: string): HTMLElement | null => {
    return blockRefs.current.get(id) || null;
  }, []);

  // Focus a specific block
  const focusBlock = useCallback(
    (id: string, cursorPosition?: number) => {
      const element = blockRefs.current.get(id);
      if (!element) return;

      // Find the editable element within the block
      const editable =
        element.querySelector('[contenteditable="true"]') ||
        element.querySelector("input") ||
        element.querySelector("textarea") ||
        element;

      if (editable instanceof HTMLElement) {
        editable.focus();

        // Set cursor position if specified
        if (cursorPosition !== undefined && "textContent" in editable) {
          setCursorPosition(editable, cursorPosition);
        }
      }

      onFocusChange?.(id);
    },
    [onFocusChange]
  );

  // Focus block at the end of its content
  const focusBlockAtEnd = useCallback(
    (id: string) => {
      const element = blockRefs.current.get(id);
      if (!element) return;

      const editable =
        element.querySelector('[contenteditable="true"]') ||
        element.querySelector("input") ||
        element.querySelector("textarea");

      if (editable instanceof HTMLElement) {
        editable.focus();

        if (editable.isContentEditable) {
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(editable);
          range.collapse(false); // Collapse to end
          selection?.removeAllRanges();
          selection?.addRange(range);
        } else if (
          editable instanceof HTMLInputElement ||
          editable instanceof HTMLTextAreaElement
        ) {
          const length = editable.value.length;
          editable.setSelectionRange(length, length);
        }
      }

      onFocusChange?.(id);
    },
    [onFocusChange]
  );

  // Focus block at the start of its content
  const focusBlockAtStart = useCallback(
    (id: string) => {
      const element = blockRefs.current.get(id);
      if (!element) return;

      const editable =
        element.querySelector('[contenteditable="true"]') ||
        element.querySelector("input") ||
        element.querySelector("textarea");

      if (editable instanceof HTMLElement) {
        editable.focus();

        if (editable.isContentEditable) {
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(editable);
          range.collapse(true); // Collapse to start
          selection?.removeAllRanges();
          selection?.addRange(range);
        } else if (
          editable instanceof HTMLInputElement ||
          editable instanceof HTMLTextAreaElement
        ) {
          editable.setSelectionRange(0, 0);
        }
      }

      onFocusChange?.(id);
    },
    [onFocusChange]
  );

  // Store current cursor position
  const saveCursorPosition = useCallback((blockId: string) => {
    const element = blockRefs.current.get(blockId);
    if (!element) return;

    const editable = element.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    if (editable && editable.isContentEditable) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        cursorPositionRef.current = {
          blockId,
          position: range.startOffset,
        };
      }
    }
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback(
    (blockId: string) => {
      if (
        cursorPositionRef.current &&
        cursorPositionRef.current.blockId === blockId
      ) {
        focusBlock(blockId, cursorPositionRef.current.position);
        cursorPositionRef.current = null;
      }
    },
    [focusBlock]
  );

  // Get current cursor position in a block
  const getCursorPosition = useCallback((blockId: string): number => {
    const element = blockRefs.current.get(blockId);
    if (!element) return 0;

    const editable = element.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    if (editable && editable.isContentEditable) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Get offset relative to the editable element
        return getTextOffset(editable, range.startContainer, range.startOffset);
      }
    }

    const input =
      element.querySelector("input") || element.querySelector("textarea");
    if (
      input instanceof HTMLInputElement ||
      input instanceof HTMLTextAreaElement
    ) {
      return input.selectionStart || 0;
    }

    return 0;
  }, []);

  // Check if cursor is at the start of a block
  const isCursorAtStart = useCallback(
    (blockId: string): boolean => {
      return getCursorPosition(blockId) === 0;
    },
    [getCursorPosition]
  );

  // Check if cursor is at the end of a block
  const isCursorAtEnd = useCallback(
    (blockId: string): boolean => {
      const element = blockRefs.current.get(blockId);
      if (!element) return false;

      const editable = element.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement | null;
      if (editable && editable.isContentEditable) {
        const textLength = editable.textContent?.length || 0;
        return getCursorPosition(blockId) >= textLength;
      }

      const input =
        element.querySelector("input") || element.querySelector("textarea");
      if (
        input instanceof HTMLInputElement ||
        input instanceof HTMLTextAreaElement
      ) {
        return getCursorPosition(blockId) >= input.value.length;
      }

      return false;
    },
    [getCursorPosition]
  );

  // Auto-focus when focusedBlockId changes
  useEffect(() => {
    if (focusedBlockId) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        focusBlock(focusedBlockId);
      });
    }
  }, [focusedBlockId, focusBlock]);

  return {
    // Registration
    registerBlockRef,
    getBlockElement,

    // Focus actions
    focusBlock,
    focusBlockAtEnd,
    focusBlockAtStart,

    // Cursor position
    saveCursorPosition,
    restoreCursorPosition,
    getCursorPosition,
    isCursorAtStart,
    isCursorAtEnd,
  };
};

// Helper function to set cursor position in contentEditable
function setCursorPosition(element: HTMLElement, position: number) {
  if (!element.isContentEditable) {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.setSelectionRange(position, position);
    }
    return;
  }

  const range = document.createRange();
  const selection = window.getSelection();

  // Walk through text nodes to find the correct position
  let currentPos = 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node = walker.nextNode();
  while (node) {
    const nodeLength = node.textContent?.length || 0;
    if (currentPos + nodeLength >= position) {
      range.setStart(node, position - currentPos);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    currentPos += nodeLength;
    node = walker.nextNode();
  }

  // If we couldn't find the position, just collapse to end
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

// Helper function to get text offset from container to a specific node
function getTextOffset(
  container: Node,
  targetNode: Node,
  offset: number
): number {
  let totalOffset = 0;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node = walker.nextNode();
  while (node) {
    if (node === targetNode) {
      return totalOffset + offset;
    }
    totalOffset += node.textContent?.length || 0;
    node = walker.nextNode();
  }

  return totalOffset + offset;
}

export type FocusManager = ReturnType<typeof useFocusManager>;
