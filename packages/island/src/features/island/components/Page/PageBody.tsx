import { ItemDataType, BlockType } from "@/types/types";
import React, { useState, useMemo } from "react";
import {
  ParagraphBlock,
  Heading1Block,
  Heading2Block,
  Heading3Block,
  BulletedListBlock,
  NumberedListBlock,
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
  TableBlock,
  BookmarkBlock,
} from "./PageComponents";

interface PageBodyProps {
  itemData: ItemDataType[] | null;
  onUpdateBlock?: (id: string, content: any, properties?: any) => void;
  onDeleteBlock?: (id: string) => void;
  onAddBlock?: (afterId: string, type: BlockType) => void;
}

const PageBody = ({
  itemData,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
}: PageBodyProps) => {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });

  // Organize blocks by parent (for nested structure)
  const { topLevelBlocks, blockChildren } = useMemo(() => {
    if (!itemData) return { topLevelBlocks: [], blockChildren: {} };

    const children: Record<string, ItemDataType[]> = {};
    const topLevel: ItemDataType[] = [];

    itemData.forEach((block) => {
      if (block.parent_id) {
        if (!children[block.parent_id]) {
          children[block.parent_id] = [];
        }
        children[block.parent_id].push(block);
      } else {
        topLevel.push(block);
      }
    });

    // Sort by order_index
    topLevel.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    Object.keys(children).forEach((parentId) => {
      children[parentId].sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      );
    });

    return { topLevelBlocks: topLevel, blockChildren: children };
  }, [itemData]);

  // Render a single block based on its type
  const renderBlock = (block: ItemDataType, depth = 0) => {
    const blockType = block.type as BlockType;
    const children = blockChildren[block.id];

    const commonProps = {
      block,
      onUpdate: onUpdateBlock,
      onDelete: onDeleteBlock,
      onAddBlock,
    };

    let BlockComponent: React.ReactNode = null;

    switch (blockType) {
      case "paragraph":
        BlockComponent = <ParagraphBlock {...commonProps} />;
        break;
      case "heading_1":
        BlockComponent = <Heading1Block {...commonProps} />;
        break;
      case "heading_2":
        BlockComponent = <Heading2Block {...commonProps} />;
        break;
      case "heading_3":
        BlockComponent = <Heading3Block {...commonProps} />;
        break;
      case "bulleted_list":
        BlockComponent = <BulletedListBlock {...commonProps} />;
        break;
      case "numbered_list":
        BlockComponent = <NumberedListBlock {...commonProps} />;
        break;
      case "todo":
        BlockComponent = <TodoBlock {...commonProps} />;
        break;
      case "toggle":
        BlockComponent = (
          <ToggleBlock {...commonProps}>
            {children &&
              children.map((child) => (
                <div key={child.id}>{renderBlock(child, depth + 1)}</div>
              ))}
          </ToggleBlock>
        );
        break;
      case "quote":
        BlockComponent = <QuoteBlock {...commonProps} />;
        break;
      case "divider":
        BlockComponent = <DividerBlock />;
        break;
      case "callout":
        BlockComponent = <CalloutBlock {...commonProps} />;
        break;
      case "code":
        BlockComponent = <CodeBlock {...commonProps} />;
        break;
      case "image":
        BlockComponent = <ImageBlock {...commonProps} />;
        break;
      case "video":
        BlockComponent = <VideoBlock {...commonProps} />;
        break;
      case "audio":
        BlockComponent = <AudioBlock {...commonProps} />;
        break;
      case "file":
        BlockComponent = <FileBlock {...commonProps} />;
        break;
      case "table":
        BlockComponent = <TableBlock {...commonProps} />;
        break;
      case "bookmark":
        BlockComponent = <BookmarkBlock {...commonProps} />;
        break;
      default:
        BlockComponent = <ParagraphBlock {...commonProps} />;
    }

    return (
      <div
        key={block.id}
        className="relative"
        style={{ paddingLeft: depth > 0 ? `${depth * 1.5}rem` : 0 }}
        onMouseEnter={() => setHoveredBlockId(block.id)}
        onMouseLeave={() => setHoveredBlockId(null)}
      >
        {/* Block action menu (appears on hover) */}
        {hoveredBlockId === block.id && (
          <div className="absolute -left-8 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => {
                // TODO: Implement block menu
                setShowBlockMenu(true);
              }}
              className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
              title="Add block"
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
            </button>
            <button
              onClick={() => {
                // TODO: Implement drag handle
              }}
              className="cursor-grab rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 active:cursor-grabbing"
              title="Drag to move"
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
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </button>
          </div>
        )}
        {BlockComponent}
      </div>
    );
  };

  if (!itemData || itemData.length === 0) {
    return (
      <div className="px-6 py-4">
        <div className="text-gray-500">
          <p className="text-base">
            Start writing or press &apos;/&apos; for commands...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div className="space-y-1">
        {topLevelBlocks.map((block) => renderBlock(block))}
      </div>

      {/* Block type selector menu (TODO: implement) */}
      {showBlockMenu && (
        <div
          className="fixed rounded-lg border border-gray-700 bg-gray-900 p-2 shadow-xl"
          style={{ top: blockMenuPosition.y, left: blockMenuPosition.x }}
        >
          <p className="text-xs text-gray-400">Block menu (coming soon)</p>
        </div>
      )}
    </div>
  );
};

export default PageBody;
