import React, { useState, useRef, useEffect } from "react";
import { ItemDataType, BlockProperties, BlockType } from "@/types/types";
import Image from "next/image";

interface BlockProps {
  block: ItemDataType;
  onUpdate?: (id: string, content: any, properties?: BlockProperties) => void;
  onDelete?: (id: string) => void;
  onAddBlock?: (afterId: string, type: BlockType) => void;
  isEditing?: boolean;
  children?: React.ReactNode;
}

// Editable content component
const EditableContent = ({
  content,
  onChange,
  placeholder = "Type something...",
  className = "",
}: {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      // Set cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  return (
    <div
      ref={ref}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onFocus={() => setIsEditing(true)}
      onBlur={() => {
        setIsEditing(false);
        if (ref.current) {
          onChange(ref.current.textContent || "");
        }
      }}
      className={`outline-none ${!content && !isEditing ? "text-gray-500" : ""} ${className}`}
      data-placeholder={placeholder}
    >
      {content || (!isEditing ? placeholder : "")}
    </div>
  );
};

// Paragraph Block
export const ParagraphBlock = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";
  return (
    <div className="group relative border py-1">
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="Type to write..."
        className="text-base leading-relaxed text-gray-200"
      />
    </div>
  );
};

// Heading Blocks
export const Heading1Block = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";
  return (
    <div className="group relative border py-2">
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="Heading 1"
        className="text-3xl font-bold text-white"
      />
    </div>
  );
};

export const Heading2Block = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";
  return (
    <div className="group relative border py-2">
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="Heading 2"
        className="text-2xl font-semibold text-white"
      />
    </div>
  );
};

export const Heading3Block = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";
  return (
    <div className="group relative border py-1">
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="Heading 3"
        className="text-xl font-medium text-white"
      />
    </div>
  );
};

// Bulleted List Block
export const BulletedListBlock = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";
  return (
    <div className="group relative flex gap-2 border py-1">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="List item"
        className="flex-1 text-base leading-relaxed text-gray-200"
      />
    </div>
  );
};

// Numbered List Block
export const NumberedListBlock = ({ block, onUpdate }: BlockProps) => {
  const number = (block.order_index || 0) + 1;
  const textContent = typeof block.content === "string" ? block.content : "";
  return (
    <div className="group relative flex gap-2 border py-1">
      <span className="flex-shrink-0 text-sm text-gray-400">{number}.</span>
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="List item"
        className="flex-1 text-base leading-relaxed text-gray-200"
      />
    </div>
  );
};

// Todo Block
export const TodoBlock = ({ block, onUpdate }: BlockProps) => {
  const [checked, setChecked] = useState(block.properties?.checked || false);
  const textContent = typeof block.content === "string" ? block.content : "";

  const toggleChecked = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    onUpdate?.(block.id, textContent, {
      ...block.properties,
      checked: newChecked,
    });
  };

  return (
    <div className="group relative flex gap-2 border py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggleChecked}
        className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-500 bg-transparent text-blue-500 focus:ring-blue-500"
      />
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="To-do"
        className={`flex-1 text-base leading-relaxed ${checked ? "text-gray-500 line-through" : "text-gray-200"}`}
      />
    </div>
  );
};

// Toggle Block
export const ToggleBlock = ({ block, onUpdate, children }: BlockProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const textContent = typeof block.content === "string" ? block.content : "";

  return (
    <div className="group relative border py-1">
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-0.5 flex-shrink-0 text-gray-400 transition-transform hover:text-gray-200"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </button>
        <EditableContent
          content={textContent}
          onChange={(content) => onUpdate?.(block.id, content)}
          placeholder="Toggle list"
          className="flex-1 text-base leading-relaxed text-gray-200"
        />
      </div>
      {isOpen && <div className="ml-6 mt-2">{children}</div>}
    </div>
  );
};

// Quote Block
export const QuoteBlock = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";
  return (
    <div className="group relative border-l-4 border-gray-500 bg-gray-800/30 py-2 pl-4">
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="Quote"
        className="text-base italic leading-relaxed text-gray-300"
      />
    </div>
  );
};

// Divider Block
export const DividerBlock = () => {
  return <hr className="my-4 border-gray-700" />;
};

// Callout Block
export const CalloutBlock = ({ block, onUpdate }: BlockProps) => {
  const icon = block.properties?.icon || "💡";
  const bgColor = block.properties?.backgroundColor || "bg-blue-900/20";
  const textContent = typeof block.content === "string" ? block.content : "";

  return (
    <div
      className={`group relative flex gap-3 rounded-lg border ${bgColor} p-4`}
    >
      <span className="text-2xl">{icon}</span>
      <EditableContent
        content={textContent}
        onChange={(content) => onUpdate?.(block.id, content)}
        placeholder="Callout"
        className="flex-1 text-base leading-relaxed text-gray-200"
      />
    </div>
  );
};

// Code Block
export const CodeBlock = ({ block, onUpdate }: BlockProps) => {
  const language = block.properties?.language || "javascript";
  const textContent = typeof block.content === "string" ? block.content : "";

  return (
    <div className="group relative my-2 border">
      <div className="mb-1 flex items-center justify-between rounded-t-lg bg-gray-800 px-3 py-1">
        <span className="text-xs text-gray-400">{language}</span>
      </div>
      <div className="overflow-x-auto rounded-b-lg bg-gray-900 p-4">
        <EditableContent
          content={textContent}
          onChange={(content) => onUpdate?.(block.id, content)}
          placeholder="// code here"
          className="font-mono text-sm leading-relaxed text-green-400"
        />
      </div>
    </div>
  );
};

// Image Block
export const ImageBlock = ({ block, onUpdate }: BlockProps) => {
  const url = block.content || block.properties?.url;
  const caption = block.properties?.caption;

  if (!url) {
    return (
      <div className="my-2 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30">
        <div className="text-center">
          <p className="text-sm text-gray-400">Click to upload image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative my-2 border">
      <div className="relative h-64 w-full overflow-hidden rounded-lg">
        <Image
          src={url}
          alt={caption || "Image"}
          fill
          className="object-contain"
        />
      </div>
      {caption && (
        <p className="mt-2 text-center text-sm text-gray-400">{caption}</p>
      )}
    </div>
  );
};

// Video Block
export const VideoBlock = ({ block }: BlockProps) => {
  const url = block.content || block.properties?.url;
  const caption = block.properties?.caption;

  if (!url) {
    return (
      <div className="my-2 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30">
        <div className="text-center">
          <p className="text-sm text-gray-400">Add video URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative my-2 border">
      <video src={url} controls className="w-full rounded-lg" />
      {caption && (
        <p className="mt-2 text-center text-sm text-gray-400">{caption}</p>
      )}
    </div>
  );
};

// Audio Block
export const AudioBlock = ({ block }: BlockProps) => {
  const url = block.content || block.properties?.url;
  const caption = block.properties?.caption;

  if (!url) {
    return (
      <div className="my-2 flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30">
        <div className="text-center">
          <p className="text-sm text-gray-400">Add audio URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative my-2 border">
      <audio src={url} controls className="w-full rounded-lg" />
      {caption && <p className="mt-2 text-sm text-gray-400">{caption}</p>}
    </div>
  );
};

// File Block
export const FileBlock = ({ block }: BlockProps) => {
  const url = block.content || block.properties?.url;
  const fileName = block.properties?.fileName || "Download file";

  if (!url) {
    return (
      <div className="my-2 flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30">
        <div className="text-center">
          <p className="text-sm text-gray-400">Add file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative my-2 border">
      <a
        href={url}
        download
        className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/30 p-3 transition-colors hover:bg-gray-800/50"
      >
        <svg
          className="h-6 w-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="text-sm text-gray-200">{fileName}</span>
      </a>
    </div>
  );
};

// Table Block (simplified)
export const TableBlock = ({ block, onUpdate }: BlockProps) => {
  const tableData =
    typeof block.content === "object" ? block.content : { rows: [[""]] };
  const rows = tableData.rows || [[""]];

  return (
    <div className="group relative my-2 overflow-x-auto border">
      <table className="w-full border-collapse rounded-lg border border-gray-700">
        <tbody>
          {rows.map((row: string[], rowIndex: number) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-700 last:border-b-0"
            >
              {row.map((cell: string, cellIndex: number) => (
                <td
                  key={cellIndex}
                  className="border-r border-gray-700 p-2 last:border-r-0"
                >
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[rowIndex][cellIndex] = e.target.value;
                      onUpdate?.(block.id, { rows: newRows });
                    }}
                    className="w-full bg-transparent text-sm text-gray-200 outline-none"
                    placeholder="Empty"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Bookmark Block
export const BookmarkBlock = ({ block }: BlockProps) => {
  const url = block.content || block.properties?.url;
  const title = block.properties?.title || url;
  const description = block.properties?.description;

  if (!url) {
    return (
      <div className="my-2 flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30">
        <div className="text-center">
          <p className="text-sm text-gray-400">Add bookmark URL</p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative my-2 flex gap-3 rounded-lg border border-gray-700 bg-gray-800/30 p-4 transition-colors hover:bg-gray-800/50"
    >
      <div className="flex-1">
        <p className="font-medium text-gray-200">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">{url}</p>
      </div>
    </a>
  );
};
