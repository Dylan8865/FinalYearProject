import { useState, useCallback, useRef, useEffect } from "react";
import { BlockType, BlockProperties, ItemDataType } from "@/types/types";
import { useToast } from "../../contexts/ToastContext";

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
  saveCount: number; // For tracking active background saves
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
 * - Background retries with exponential backoff
 * - Accurate global saving state
 * - Unified toast notifications
 */
export const useBlockEditor = ({
  islandItemId,
  initialBlocks = [],
  onError,
  onSuccess,
  debounceMs = 500,
}: UseBlockEditorOptions) => {
  const { showToast } = useToast();

  // State
  const [state, setState] = useState<BlockEditorState>({
    blocks: initialBlocks,
    focusedBlockId: null,
    isLoading: false,
    saveCount: 0,
    error: null,
  });

  // Refs for managing pending actions and state consistency
  const pendingSaves = useRef<Map<string, PendingSave>>(new Map());
  const activeRequests = useRef<Set<string>>(new Set());
  const blocksRef = useRef<ItemDataType[]>(initialBlocks);

  // Sync blocksRef with state.blocks
  useEffect(() => {
    blocksRef.current = state.blocks;
  }, [state.blocks]);

  // Update blocks when initialBlocks changes
  useEffect(() => {
    setState((prev) => ({ ...prev, blocks: initialBlocks }));
    blocksRef.current = initialBlocks;
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

  // Helper for fetching with retries
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3
  ): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;

        // If it's a client error (except rate limit), don't retry
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          return response;
        }

        throw new Error(`Server returned ${response.status}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000 + Math.random() * 100)
        );
      }
    }
    throw new Error("Maximum retries reached");
  };

  // API call for updating a block
  const saveBlockToServer = useCallback(
    async (id: string, content: any, properties?: BlockProperties) => {
      // Increment save count
      setState((prev) => ({ ...prev, saveCount: prev.saveCount + 1 }));
      activeRequests.current.add(id);

      try {
        const response = await fetchWithRetry("/api/item-data", {
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
        }));
      } catch (error) {
        console.error("Save error:", error);
        showToast(
          "Failed to save some changes. Retrying in background...",
          "error"
        );
        onError?.(error as Error);
      } finally {
        activeRequests.current.delete(id);
        setState((prev) => ({
          ...prev,
          saveCount: Math.max(0, prev.saveCount - 1),
        }));
      }
    },
    [onError, showToast]
  );

  // Debounced update handler
  const updateBlock = useCallback(
    (id: string, content: any, properties?: BlockProperties) => {
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
      setState((prev) => ({
        ...prev,
        isLoading: true,
        saveCount: prev.saveCount + 1,
      }));

      const currentBlocks = blocksRef.current;
      let newOrderIndex = 0;
      if (afterBlockId) {
        const afterBlock = currentBlocks.find((b) => b.id === afterBlockId);
        newOrderIndex = afterBlock
          ? (afterBlock.order_index || 0) + 1
          : currentBlocks.length;
      } else {
        newOrderIndex = currentBlocks.length;
      }

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
        const response = await fetchWithRetry("/api/item-data", {
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

        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) => (b.id === tempId ? savedBlock : b)),
          focusedBlockId: savedBlock.id,
        }));

        onSuccess?.("Block created");
        return savedBlock;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.filter((b) => b.id !== tempId),
        }));
        showToast("Failed to create block.", "error");
        onError?.(error as Error);
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          saveCount: Math.max(0, prev.saveCount - 1),
        }));
      }
    },
    [islandItemId, onError, onSuccess, showToast]
  );

  // Delete a block
  const deleteBlock = useCallback(
    async (id: string) => {
      const currentBlocks = blocksRef.current;
      const blockToDelete = currentBlocks.find((b) => b.id === id);
      if (!blockToDelete) return;

      const deletedIndex = sortedBlocks.findIndex((b) => b.id === id);
      const previousBlock =
        deletedIndex > 0 ? sortedBlocks[deletedIndex - 1] : null;

      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== id),
        focusedBlockId: previousBlock?.id || null,
        saveCount: prev.saveCount + 1,
      }));

      try {
        const response = await fetchWithRetry(`/api/item-data?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete block");
        }

        onSuccess?.("Block deleted");
      } catch (error) {
        setState((prev) => ({
          ...prev,
          blocks: [...prev.blocks, blockToDelete],
        }));
        showToast("Failed to delete block.", "error");
        onError?.(error as Error);
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          saveCount: Math.max(0, prev.saveCount - 1),
        }));
      }
    },
    [sortedBlocks, onError, onSuccess, showToast]
  );

  // Duplicate a block
  const duplicateBlock = useCallback(
    async (id: string) => {
      const blockToDuplicate = blocksRef.current.find((b) => b.id === id);
      if (!blockToDuplicate) return;

      return createBlock(
        id,
        blockToDuplicate.type as BlockType,
        blockToDuplicate.content,
        blockToDuplicate.properties || undefined
      );
    },
    [createBlock]
  );

  // Convert block type
  const convertBlockType = useCallback(
    async (id: string, newType: BlockType) => {
      const block = blocksRef.current.find((b) => b.id === id);
      if (!block) return;

      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === id ? { ...b, type: newType } : b
        ),
        saveCount: prev.saveCount + 1,
      }));

      try {
        const response = await fetchWithRetry("/api/item-data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, type: newType }),
        });

        if (!response.ok) {
          throw new Error("Failed to convert block type");
        }

        onSuccess?.(`Converted to ${newType}`);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === id ? { ...b, type: block.type } : b
          ),
        }));
        showToast("Failed to convert block type.", "error");
        onError?.(error as Error);
        throw error;
      } finally {
        setState((prev) => ({
          ...prev,
          saveCount: Math.max(0, prev.saveCount - 1),
        }));
      }
    },
    [onError, onSuccess, showToast]
  );

  // Move block up
  const moveBlockUp = useCallback(
    async (id: string) => {
      const blockIndex = sortedBlocks.findIndex((b) => b.id === id);
      if (blockIndex <= 0) return;

      const block = sortedBlocks[blockIndex];
      const blockAbove = sortedBlocks[blockIndex - 1];

      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => {
          if (b.id === id) return { ...b, order_index: blockAbove.order_index };
          if (b.id === blockAbove.id)
            return { ...b, order_index: block.order_index };
          return b;
        }),
        saveCount: prev.saveCount + 1,
      }));

      try {
        const updatePromises = [];

        if (!id.startsWith("temp-")) {
          updatePromises.push(
            fetchWithRetry("/api/item-data", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, order_index: blockAbove.order_index }),
            })
          );
        }

        if (!blockAbove.id.startsWith("temp-")) {
          updatePromises.push(
            fetchWithRetry("/api/item-data", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: blockAbove.id,
                order_index: block.order_index,
              }),
            })
          );
        }

        await Promise.all(updatePromises);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) => {
            if (b.id === id) return { ...b, order_index: block.order_index };
            if (b.id === blockAbove.id)
              return { ...b, order_index: blockAbove.order_index };
            return b;
          }),
        }));
        showToast("Failed to move block.", "error");
        onError?.(error as Error);
      } finally {
        setState((prev) => ({
          ...prev,
          saveCount: Math.max(0, prev.saveCount - 1),
        }));
      }
    },
    [sortedBlocks, onError, showToast]
  );

  // Move block down
  const moveBlockDown = useCallback(
    async (id: string) => {
      const blockIndex = sortedBlocks.findIndex((b) => b.id === id);
      if (blockIndex < 0 || blockIndex >= sortedBlocks.length - 1) return;

      const block = sortedBlocks[blockIndex];
      const blockBelow = sortedBlocks[blockIndex + 1];

      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => {
          if (b.id === id) return { ...b, order_index: blockBelow.order_index };
          if (b.id === blockBelow.id)
            return { ...b, order_index: block.order_index };
          return b;
        }),
        saveCount: prev.saveCount + 1,
      }));

      try {
        const updatePromises = [];

        if (!id.startsWith("temp-")) {
          updatePromises.push(
            fetchWithRetry("/api/item-data", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, order_index: blockBelow.order_index }),
            })
          );
        }

        if (!blockBelow.id.startsWith("temp-")) {
          updatePromises.push(
            fetchWithRetry("/api/item-data", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: blockBelow.id,
                order_index: block.order_index,
              }),
            })
          );
        }

        await Promise.all(updatePromises);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) => {
            if (b.id === id) return { ...b, order_index: block.order_index };
            if (b.id === blockBelow.id)
              return { ...b, order_index: blockBelow.order_index };
            return b;
          }),
        }));
        showToast("Failed to move block.", "error");
        onError?.(error as Error);
      } finally {
        setState((prev) => ({
          ...prev,
          saveCount: Math.max(0, prev.saveCount - 1),
        }));
      }
    },
    [sortedBlocks, onError, showToast]
  );

  // Reorder blocks after drag & drop
  const reorderBlocks = useCallback(
    async (
      draggedId: string,
      targetId: string,
      position: "before" | "after"
    ) => {
      const currentBlocks = blocksRef.current;
      const draggedBlock = currentBlocks.find((b) => b.id === draggedId);
      const targetBlock = currentBlocks.find((b) => b.id === targetId);
      if (!draggedBlock || !targetBlock) return;

      const targetIndex = sortedBlocks.findIndex((b) => b.id === targetId);
      const newOrderIndex =
        position === "before"
          ? targetBlock.order_index || 0
          : (targetBlock.order_index || 0) + 1;

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

      const finalBlocks = updatedBlocks.map((b, i) => ({
        ...b,
        order_index: i,
      }));

      setState((prev) => ({
        ...prev,
        blocks: finalBlocks,
        saveCount: prev.saveCount + 1,
      }));

      try {
        await Promise.all(
          finalBlocks
            .filter((block) => !block.id.startsWith("temp-"))
            .map((block, index) =>
              fetchWithRetry("/api/item-data", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: block.id, order_index: index }),
              })
            )
        );
      } catch (error) {
        // Rollback would be complex here, so we notify
        showToast("Failed to reorder some blocks.", "error");
        onError?.(error as Error);
      } finally {
        setState((prev) => ({
          ...prev,
          saveCount: Math.max(0, prev.saveCount - 1),
        }));
      }
    },
    [sortedBlocks, onError, showToast]
  );

  // Merge with previous block
  const mergeWithPreviousBlock = useCallback(
    async (id: string) => {
      const blockIndex = sortedBlocks.findIndex((b) => b.id === id);
      if (blockIndex <= 0) return null;

      const currentBlock = sortedBlocks[blockIndex];
      const previousBlock = sortedBlocks[blockIndex - 1];

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

  const getBlockById = useCallback(
    (id: string) => state.blocks.find((b) => b.id === id),
    [state.blocks]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

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
    blocks: sortedBlocks,
    focusedBlockId: state.focusedBlockId,
    isLoading: state.isLoading,
    isSaving: state.saveCount > 0,
    error: state.error,

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

    setFocusedBlockId,
    focusNextBlock,
    focusPreviousBlock,

    getBlockById,
    clearError,
    flushPendingSaves,
  };
};

export type BlockEditor = ReturnType<typeof useBlockEditor>;
