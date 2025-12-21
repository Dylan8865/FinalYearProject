"use client";

import React, { useMemo } from "react";
import { ItemDataType, BlockType, BlockProperties } from "@/types/types";
import {
  ParagraphBlock,
  Heading1Block,
  Heading2Block,
  Heading3Block,
  BulletedListBlock,
  TodoBlock,
  ToggleBlock,
  QuoteBlock,
  DividerBlock,
  CalloutBlock,
  CodeBlock,
  ImageBlock,
  VideoBlock,
  AudioBlock,
  FileBlock,
  BookmarkBlock,
} from "../Page/PageComponents";

interface BlockRendererProps {
  block: ItemDataType;
  onUpdate: (id: string, content: any, properties?: BlockProperties) => void;
  onDelete: (id: string) => void;
  onAddBlock: (afterId: string, type: BlockType) => void;
  children?: React.ReactNode; // For nested blocks (toggle)
}

/**
 * BlockRenderer Component
 *
 * Renders the appropriate block component based on the block type.
 * Uses a switch statement for clear type mapping.
 */
const BlockRenderer = React.memo(
  ({ block, onUpdate, onDelete, onAddBlock, children }: BlockRendererProps) => {
    const blockType = block.type as BlockType;

    const commonProps = {
      block,
      onUpdate,
      onDelete,
      onAddBlock,
      isEditing: false,
    };

    // Memoize the block component to prevent unnecessary re-renders
    const BlockComponent = useMemo(() => {
      switch (blockType) {
        case "paragraph":
          return <ParagraphBlock {...commonProps} />;

        case "heading_1":
          return <Heading1Block {...commonProps} />;

        case "heading_2":
          return <Heading2Block {...commonProps} />;

        case "heading_3":
          return <Heading3Block {...commonProps} />;

        case "bulleted_list":
          return <BulletedListBlock {...commonProps} />;

        case "todo":
          return <TodoBlock {...commonProps} />;

        case "toggle":
          return <ToggleBlock {...commonProps}>{children}</ToggleBlock>;

        case "quote":
          return <QuoteBlock {...commonProps} />;

        case "divider":
          return <DividerBlock />;

        case "callout":
          return <CalloutBlock {...commonProps} />;

        case "code":
          return <CodeBlock {...commonProps} />;

        case "image":
          return <ImageBlock {...commonProps} />;

        case "video":
          return <VideoBlock {...commonProps} />;

        case "audio":
          return <AudioBlock {...commonProps} />;

        case "file":
          return <FileBlock {...commonProps} />;

        case "bookmark":
          return <BookmarkBlock {...commonProps} />;

        // Default to paragraph for unknown types
        default:
          console.warn(
            `Unknown block type: ${blockType}, rendering as paragraph`
          );
          return <ParagraphBlock {...commonProps} />;
      }
    }, [blockType, block, onUpdate, onDelete, onAddBlock, children]);

    return BlockComponent;
  }
);

BlockRenderer.displayName = "BlockRenderer";

export default BlockRenderer;
