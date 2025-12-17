import { useState, useCallback } from "react";
import { BlockType, BlockProperties, ItemDataType } from "@/types/types";

interface UseBlockManagerOptions {
  islandItemId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useBlockManager = ({
  islandItemId,
  onSuccess,
  onError,
}: UseBlockManagerOptions) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create a new block
  const createBlock = useCallback(
    async (
      type: BlockType,
      content: any = "",
      options?: {
        properties?: BlockProperties;
        parentId?: string;
        orderIndex?: number;
      }
    ) => {
      setIsCreating(true);
      try {
        const response = await fetch("/api/item-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            island_item_id: islandItemId,
            type,
            content,
            properties: options?.properties || null,
            parent_id: options?.parentId || null,
            order_index: options?.orderIndex ?? 0,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create block");
        }

        const newBlock = await response.json();
        onSuccess?.();
        return newBlock as ItemDataType;
      } catch (error) {
        const err = error as Error;
        onError?.(err);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [islandItemId, onSuccess, onError]
  );

  // Update an existing block
  const updateBlock = useCallback(
    async (
      id: string,
      updates: {
        content?: any;
        properties?: BlockProperties;
        type?: BlockType;
        orderIndex?: number;
        parentId?: string;
      }
    ) => {
      setIsUpdating(true);
      try {
        const response = await fetch("/api/item-data", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            content: updates.content,
            properties: updates.properties,
            type: updates.type,
            order_index: updates.orderIndex,
            parent_id: updates.parentId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update block");
        }

        const updatedBlock = await response.json();
        onSuccess?.();
        return updatedBlock as ItemDataType;
      } catch (error) {
        const err = error as Error;
        onError?.(err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [onSuccess, onError]
  );

  // Delete a block
  const deleteBlock = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/item-data?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete block");
        }

        onSuccess?.();
        return true;
      } catch (error) {
        const err = error as Error;
        onError?.(err);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [onSuccess, onError]
  );

  // Duplicate a block
  const duplicateBlock = useCallback(
    async (block: ItemDataType) => {
      return createBlock(block.type as BlockType, block.content, {
        properties: block.properties || undefined,
        parentId: block.parent_id || undefined,
        orderIndex: (block.order_index || 0) + 1,
      });
    },
    [createBlock]
  );

  // Move block up
  const moveBlockUp = useCallback(
    async (block: ItemDataType, blocks: ItemDataType[]) => {
      const currentIndex = block.order_index || 0;
      if (currentIndex <= 0) return;

      // Find the block above
      const blockAbove = blocks.find((b) => b.order_index === currentIndex - 1);
      if (!blockAbove) return;

      // Swap order indexes
      await Promise.all([
        updateBlock(block.id, { orderIndex: currentIndex - 1 }),
        updateBlock(blockAbove.id, { orderIndex: currentIndex }),
      ]);
    },
    [updateBlock]
  );

  // Move block down
  const moveBlockDown = useCallback(
    async (block: ItemDataType, blocks: ItemDataType[]) => {
      const currentIndex = block.order_index || 0;
      const maxIndex = Math.max(...blocks.map((b) => b.order_index || 0));
      if (currentIndex >= maxIndex) return;

      // Find the block below
      const blockBelow = blocks.find((b) => b.order_index === currentIndex + 1);
      if (!blockBelow) return;

      // Swap order indexes
      await Promise.all([
        updateBlock(block.id, { orderIndex: currentIndex + 1 }),
        updateBlock(blockBelow.id, { orderIndex: currentIndex }),
      ]);
    },
    [updateBlock]
  );

  // Convert block to different type
  const convertBlockType = useCallback(
    async (id: string, newType: BlockType) => {
      return updateBlock(id, { type: newType });
    },
    [updateBlock]
  );

  return {
    // Actions
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlockUp,
    moveBlockDown,
    convertBlockType,

    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    isLoading: isCreating || isUpdating || isDeleting,
  };
};
