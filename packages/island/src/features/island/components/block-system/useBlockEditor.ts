"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { BlockType, BlockProperties, ItemDataType } from "@/types/types";

interface UseBlockEditorOptions {
  islandItemId: string;
  initialBlocks?: ItemDataType[];
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
  debounceMs?: number;
}

interface BlockEditorState {
  blocks: ItemDataType[];
  focusedBlockId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface PendingSave {
  id: string;
  content: any;
  properties?: BlockProperties;
  timeoutId: NodeJS.Timeout;
}

/**
 * useBlockEditor Hook
 *
 * Comprehensive hook for managing block state with:
 * - Debounced auto-save (500ms by default)
 * - Optimistic updates
 * - Error handling with rollback
 * - Focus management
 * - Block CRUD operations
 */
export const useBlockEditor = ({
  islandItemId,
  initialBlocks = [],
  onError,
  onSuccess,
  debounceMs = 500,
}: UseBlockEditorOptions) => {
  // State
  const [state, setState] = useState<BlockEditorState>({
    blocks: initialBlocks,
    focusedBlockId: null,
    isLoading: false,
    isSaving: false,
    error: null,
  });

  // Refs for managing pending saves and previous state
  const pendingSaves = useRef<Map<string, PendingSave>>(new Map());
  const previousBlocks = useRef<ItemDataType[]>(initialBlocks);

  // Update blocks when initialBlocks changes
  useEffect(() => {
    setState((prev) => ({ ...prev, blocks: initialBlocks }));
    previousBlocks.current = initialBlocks;
  }, [initialBlocks]);

  // Clear all pending saves on unmount
  useEffect(() => {
    return () => {
      pendingSaves.current.forEach((save) => clearTimeout(save.timeoutId));
      pendingSaves.current.clear();
    };
  }, []);

  // Sort blocks by order_index
  const sortedBlocks = [...state.blocks].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0)
  );

  // API call for updating a block
  const saveBlockToServer = useCallback(
    async (id: string, content: any, properties?: BlockProperties) => {
      setState((prev) => ({ ...prev, isSaving: true }));
      try {
        const response = await fetch("/api/item-data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, content, properties }),
        });

        if (!response.ok) {
          throw new Error("Failed to save block");
        }

        const updatedBlock = await response.json();

        // Update the block with server response
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === id ? { ...b, ...updatedBlock } : b
          ),
          isSaving: false,
        }));

        // Update previous blocks ref
        previousBlocks.current = state.blocks.map((b) =>
          b.id === id ? { ...b, ...updatedBlock } : b
        );

        return updatedBlock;
      } catch (error) {
        // Rollback on error
        setState((prev) => ({
          ...prev,
          blocks: previousBlocks.current,
          isSaving: false,
          error: "Failed to save changes",
        }));
        onError?.(error as Error);
        throw error;
      }
    },
    [state.blocks, onError]
  );

  // Debounced update handler
  const updateBlock = useCallback(
    (id: string, content: any, properties?: BlockProperties) => {
      // Cancel any pending save for this block
      const existingPendingSave = pendingSaves.current.get(id);
      if (existingPendingSave) {
        clearTimeout(existingPendingSave.timeoutId);
      }

      // Optimistic update
      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === id
            ? { ...b, content, properties: { ...b.properties, ...properties } }
            : b
        ),
      }));

      // Schedule debounced save
      const timeoutId = setTimeout(() => {
        saveBlockToServer(id, content, properties);
        pendingSaves.current.delete(id);
      }, debounceMs);

      pendingSaves.current.set(id, { id, content, properties, timeoutId });
    },
    [debounceMs, saveBlockToServer]
  );

  // Immediate save (bypass debounce)
  const saveBlockImmediately = useCallback(
    async (id: string, content: any, properties?: BlockProperties) => {
      // Cancel any pending debounced save
      const existingPendingSave = pendingSaves.current.get(id);
      if (existingPendingSave) {
        clearTimeout(existingPendingSave.timeoutId);
        pendingSaves.current.delete(id);
      }

      return saveBlockToServer(id, content, properties);
    },
    [saveBlockToServer]
  );

  // Create a new block
  const createBlock = useCallback(
    async (
      afterBlockId: string | null,
      type: BlockType,
      content: any = "",
      properties?: BlockProperties
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Calculate order_index
      let newOrderIndex = 0;
      if (afterBlockId) {
        const afterBlock = state.blocks.find((b) => b.id === afterBlockId);
        newOrderIndex = afterBlock
          ? (afterBlock.order_index || 0) + 1
          : state.blocks.length;
      } else {
        newOrderIndex = state.blocks.length;
      }

      // Create optimistic block
      const tempId = `temp-${Date.now()}`;
      const optimisticBlock: ItemDataType = {
        id: tempId,
        created_at: new Date().toISOString(),
        type,
        content,
        island_item_id: islandItemId,
        valid: true,
        order_index: newOrderIndex,
        properties: properties || null,
      };

      // Optimistic update - Insert block and shift order_index of blocks after it
      setState((prev) => ({
        ...prev,
        blocks: [
          ...prev.blocks.map((b) =>
            (b.order_index || 0) >= newOrderIndex
              ? { ...b, order_index: (b.order_index || 0) + 1 }
              : b
          ),
          optimisticBlock,
        ],
        focusedBlockId: tempId,
      }));

      try {
        const response = await fetch("/api/item-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            island_item_id: islandItemId,
            type,
            content,
            properties,
            order_index: newOrderIndex,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create block");
        }

        const savedBlock = await response.json();

        // Replace temp block with saved block
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) => (b.id === tempId ? savedBlock : b)),
          focusedBlockId: savedBlock.id,
          isLoading: false,
        }));

        onSuccess?.("Block created");
        return savedBlock;
      } catch (error) {
        // Rollback
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.filter((b) => b.id !== tempId),
          isLoading: false,
          error: "Failed to create block",
        }));
        onError?.(error as Error);
        throw error;
      }
    },
    [islandItemId, state.blocks, onError, onSuccess]
  );

  // Delete a block
  const deleteBlock = useCallback(
    async (id: string) => {
      const blockToDelete = state.blocks.find((b) => b.id === id);
      if (!blockToDelete) return;

      // Find the previous block to focus
      const deletedIndex = sortedBlocks.findIndex((b) => b.id === id);
      const previousBlock =
        deletedIndex > 0 ? sortedBlocks[deletedIndex - 1] : null;

      // Optimistic delete
      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== id),
        focusedBlockId: previousBlock?.id || null,
        isLoading: true,
      }));

      try {
        const response = await fetch(`/api/item-data?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete block");
        }

        setState((prev) => ({ ...prev, isLoading: false }));
        onSuccess?.("Block deleted");
      } catch (error) {
        // Rollback
        setState((prev) => ({
          ...prev,
          blocks: [...prev.blocks, blockToDelete],
          isLoading: false,
          error: "Failed to delete block",
        }));
        onError?.(error as Error);
        throw error;
      }
    },
    [state.blocks, sortedBlocks, onError, onSuccess]
  );

  // Duplicate a block
  const duplicateBlock = useCallback(
    async (id: string) => {
      const blockToDuplicate = state.blocks.find((b) => b.id === id);
      if (!blockToDuplicate) return;

      return createBlock(
        id,
        blockToDuplicate.type as BlockType,
        blockToDuplicate.content,
        blockToDuplicate.properties || undefined
      );
    },
    [state.blocks, createBlock]
  );

  // Convert block type
  const convertBlockType = useCallback(
    async (id: string, newType: BlockType) => {
      const block = state.blocks.find((b) => b.id === id);
      if (!block) return;

      // Optimistic update
      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === id ? { ...b, type: newType } : b
        ),
        isSaving: true,
      }));

      try {
        const response = await fetch("/api/item-data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, type: newType }),
        });

        if (!response.ok) {
          throw new Error("Failed to convert block type");
        }

        setState((prev) => ({ ...prev, isSaving: false }));
        onSuccess?.(`Converted to ${newType}`);
      } catch (error) {
        // Rollback
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === id ? { ...b, type: block.type } : b
          ),
          isSaving: false,
          error: "Failed to convert block",
        }));
        onError?.(error as Error);
        throw error;
      }
    },
    [state.blocks, onError, onSuccess]
  );

  // Move block up
  const moveBlockUp = useCallback(
    async (id: string) => {
      const blockIndex = sortedBlocks.findIndex((b) => b.id === id);
      if (blockIndex <= 0) return;

      const block = sortedBlocks[blockIndex];
      const blockAbove = sortedBlocks[blockIndex - 1];

      // Optimistic update
      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => {
          if (b.id === id) return { ...b, order_index: blockAbove.order_index };
          if (b.id === blockAbove.id)
            return { ...b, order_index: block.order_index };
          return b;
        }),
      }));

      try {
        await Promise.all([
          fetch("/api/item-data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, order_index: blockAbove.order_index }),
          }),
          fetch("/api/item-data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: blockAbove.id,
              order_index: block.order_index,
            }),
          }),
        ]);
      } catch (error) {
        // Rollback
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) => {
            if (b.id === id) return { ...b, order_index: block.order_index };
            if (b.id === blockAbove.id)
              return { ...b, order_index: blockAbove.order_index };
            return b;
          }),
        }));
        onError?.(error as Error);
      }
    },
    [sortedBlocks, onError]
  );

  // Move block down
  const moveBlockDown = useCallback(
    async (id: string) => {
      const blockIndex = sortedBlocks.findIndex((b) => b.id === id);
      if (blockIndex < 0 || blockIndex >= sortedBlocks.length - 1) return;

      const block = sortedBlocks[blockIndex];
      const blockBelow = sortedBlocks[blockIndex + 1];

      // Optimistic update
      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => {
          if (b.id === id) return { ...b, order_index: blockBelow.order_index };
          if (b.id === blockBelow.id)
            return { ...b, order_index: block.order_index };
          return b;
        }),
      }));

      try {
        await Promise.all([
          fetch("/api/item-data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, order_index: blockBelow.order_index }),
          }),
          fetch("/api/item-data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: blockBelow.id,
              order_index: block.order_index,
            }),
          }),
        ]);
      } catch (error) {
        // Rollback
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) => {
            if (b.id === id) return { ...b, order_index: block.order_index };
            if (b.id === blockBelow.id)
              return { ...b, order_index: blockBelow.order_index };
            return b;
          }),
        }));
        onError?.(error as Error);
      }
    },
    [sortedBlocks, onError]
  );

  // Reorder blocks after drag & drop
  const reorderBlocks = useCallback(
    async (
      draggedId: string,
      targetId: string,
      position: "before" | "after"
    ) => {
      const draggedBlock = state.blocks.find((b) => b.id === draggedId);
      const targetBlock = state.blocks.find((b) => b.id === targetId);
      if (!draggedBlock || !targetBlock) return;

      const targetIndex = sortedBlocks.findIndex((b) => b.id === targetId);
      const newOrderIndex =
        position === "before"
          ? targetBlock.order_index || 0
          : (targetBlock.order_index || 0) + 1;

      // Recalculate all order indexes
      const updatedBlocks = sortedBlocks
        .filter((b) => b.id !== draggedId)
        .map((b, index) => {
          const adjustedIndex = index >= newOrderIndex ? index + 1 : index;
          return { ...b, order_index: adjustedIndex };
        });

      updatedBlocks.splice(
        position === "before" ? targetIndex : targetIndex + 1,
        0,
        { ...draggedBlock, order_index: newOrderIndex }
      );

      // Optimistic update
      setState((prev) => ({
        ...prev,
        blocks: updatedBlocks.map((b, i) => ({ ...b, order_index: i })),
      }));

      // Save all order changes
      try {
        await Promise.all(
          updatedBlocks.map((block, index) =>
            fetch("/api/item-data", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: block.id, order_index: index }),
            })
          )
        );
      } catch (error) {
        // Rollback
        setState((prev) => ({ ...prev, blocks: previousBlocks.current }));
        onError?.(error as Error);
      }
    },
    [state.blocks, sortedBlocks, onError]
  );

  // Merge with previous block (for backspace at start)
  const mergeWithPreviousBlock = useCallback(
    async (id: string) => {
      const blockIndex = sortedBlocks.findIndex((b) => b.id === id);
      if (blockIndex <= 0) return null;

      const currentBlock = sortedBlocks[blockIndex];
      const previousBlock = sortedBlocks[blockIndex - 1];

      // Only merge text-based blocks
      const textBlockTypes = [
        "paragraph",
        "heading_1",
        "heading_2",
        "heading_3",
        "quote",
        "bulleted_list",
        "numbered_list",
      ];

      if (
        !textBlockTypes.includes(currentBlock.type as string) ||
        !textBlockTypes.includes(previousBlock.type as string)
      ) {
        return null;
      }

      const currentContent =
        typeof currentBlock.content === "string" ? currentBlock.content : "";
      const previousContent =
        typeof previousBlock.content === "string" ? previousBlock.content : "";
      const mergedContent = previousContent + currentContent;
      const cursorPosition = previousContent.length;

      // Delete current block and update previous
      await deleteBlock(id);
      await saveBlockImmediately(previousBlock.id, mergedContent);

      return { blockId: previousBlock.id, cursorPosition };
    },
    [sortedBlocks, deleteBlock, saveBlockImmediately]
  );

  // Focus management
  const setFocusedBlockId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, focusedBlockId: id }));
  }, []);

  const focusNextBlock = useCallback(() => {
    if (!state.focusedBlockId) {
      if (sortedBlocks.length > 0) {
        setState((prev) => ({ ...prev, focusedBlockId: sortedBlocks[0].id }));
      }
      return;
    }

    const currentIndex = sortedBlocks.findIndex(
      (b) => b.id === state.focusedBlockId
    );
    if (currentIndex < sortedBlocks.length - 1) {
      setState((prev) => ({
        ...prev,
        focusedBlockId: sortedBlocks[currentIndex + 1].id,
      }));
    }
  }, [state.focusedBlockId, sortedBlocks]);

  const focusPreviousBlock = useCallback(() => {
    if (!state.focusedBlockId) return;

    const currentIndex = sortedBlocks.findIndex(
      (b) => b.id === state.focusedBlockId
    );
    if (currentIndex > 0) {
      setState((prev) => ({
        ...prev,
        focusedBlockId: sortedBlocks[currentIndex - 1].id,
      }));
    }
  }, [state.focusedBlockId, sortedBlocks]);

  // Get block by ID
  const getBlockById = useCallback(
    (id: string) => state.blocks.find((b) => b.id === id),
    [state.blocks]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Flush all pending saves
  const flushPendingSaves = useCallback(async () => {
    const saves = Array.from(pendingSaves.current.values());
    pendingSaves.current.forEach((save) => clearTimeout(save.timeoutId));
    pendingSaves.current.clear();

    await Promise.all(
      saves.map((save) =>
        saveBlockToServer(save.id, save.content, save.properties)
      )
    );
  }, [saveBlockToServer]);

  return {
    // State
    blocks: sortedBlocks,
    focusedBlockId: state.focusedBlockId,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,

    // Block operations
    updateBlock,
    saveBlockImmediately,
    createBlock,
    deleteBlock,
    duplicateBlock,
    convertBlockType,
    moveBlockUp,
    moveBlockDown,
    reorderBlocks,
    mergeWithPreviousBlock,

    // Focus management
    setFocusedBlockId,
    focusNextBlock,
    focusPreviousBlock,

    // Utilities
    getBlockById,
    clearError,
    flushPendingSaves,
  };
};

export type BlockEditor = ReturnType<typeof useBlockEditor>;
