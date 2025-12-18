import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
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
// Using React.memo to prevent re-renders when parent re-renders but content/handlers haven't changed
// though the issue is mostly about the internal DOM management
const EditableContent = React.memo(
  ({
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
    const ref = useRef<HTMLDivElement>(null);

    // Use useLayoutEffect to update DOM before paint
    // This handles both initial load and external updates
    useLayoutEffect(() => {
      // We only update the DOM if:
      // 1. The new content is different from what's currently in the DOM
      // 2. AND (we are not focused OR the DOM is empty)
      // This ensures we don't mess with the cursor while the user is typing,
      // but we still update if the content changed externally or it's the first render.
      if (ref.current && ref.current.innerText !== content) {
        if (document.activeElement !== ref.current) {
          ref.current.innerText = content;
        }
      }
    }, [content]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const text = e.currentTarget.innerText;
      // Only fire change if actually different to avoid unnecessary loops
      if (text !== content) {
        onChange(text);
      }
    };

    return (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className={`min-h-[1.5em] cursor-text outline-none empty:before:text-gray-500 empty:before:content-[attr(data-placeholder)] ${className}`}
        data-placeholder={placeholder}
      />
    );
  }
);
EditableContent.displayName = "EditableContent";

// Paragraph Block
export const ParagraphBlock = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    console.log("ParagraphBlock onChange:", { id: block.id, content });
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative py-1">
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Type to write..."
        className="text-base leading-relaxed text-gray-200"
      />
    </div>
  );
};

// Heading Blocks
export const Heading1Block = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    console.log("Heading1Block onChange:", { id: block.id, content });
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative py-2">
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Heading 1"
        className="text-3xl font-bold text-white"
      />
    </div>
  );
};

export const Heading2Block = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    console.log("Heading2Block onChange:", { id: block.id, content });
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative py-2">
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Heading 2"
        className="text-2xl font-semibold text-white"
      />
    </div>
  );
};

export const Heading3Block = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    console.log("Heading3Block onChange:", { id: block.id, content });
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative py-1">
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Heading 3"
        className="text-xl font-medium text-white"
      />
    </div>
  );
};

// Bulleted List Block
export const BulletedListBlock = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    console.log("BulletedListBlock onChange:", { id: block.id, content });
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative flex gap-2 py-1">
      <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
      <EditableContent
        content={textContent}
        onChange={handleChange}
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

  const handleChange = (content: string) => {
    console.log("NumberedListBlock onChange:", { id: block.id, content });
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative flex gap-2 border py-1">
      <span className="flex-shrink-0 text-sm text-gray-400">{number}.</span>
      <EditableContent
        content={textContent}
        onChange={handleChange}
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
    console.log("TodoBlock toggleChecked:", {
      id: block.id,
      content: textContent,
      checked: newChecked,
    });
    onUpdate?.(block.id, textContent, {
      ...block.properties,
      checked: newChecked,
    });
  };

  const handleChange = (content: string) => {
    console.log("TodoBlock onChange:", {
      id: block.id,
      content,
      checked,
    });
    onUpdate?.(block.id, content, {
      ...block.properties,
      checked,
    });
  };

  return (
    <div className="group relative flex gap-2 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggleChecked}
        className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-500 bg-transparent text-blue-500 focus:ring-blue-500"
      />
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="To-do"
        className={`flex-1 text-base leading-relaxed ${checked ? "text-gray-500 line-through" : "text-gray-200"}`}
      />
    </div>
  );
};

// Toggle Block
// Toggle Block
export const ToggleBlock = ({ block, onUpdate, children }: BlockProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const summaryContent = typeof block.content === "string" ? block.content : "";
  // Optional: extended details stored in properties, if the user wants text *inside* the toggle besides nested blocks
  const detailsContent = block.properties?.details || "";

  const handleSummaryChange = (content: string) => {
    onUpdate?.(block.id, content, block.properties || undefined);
  };

  const handleDetailsChange = (content: string) => {
    onUpdate?.(block.id, summaryContent, {
      ...block.properties,
      details: content,
    });
  };

  return (
    <div className="group relative py-1">
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-0.5 flex-shrink-0 text-gray-400 transition-transform hover:text-gray-200"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </button>
        <EditableContent
          content={summaryContent}
          onChange={handleSummaryChange}
          placeholder="Toggle list"
          className="flex-1 text-base leading-relaxed text-gray-200"
        />
      </div>
      {isOpen && (
        <div className="ml-6 mt-2">
          {/* If user specifically wants a text area inside the toggle *before* nested blocks */}
          <EditableContent
            content={detailsContent}
            onChange={handleDetailsChange}
            className="mb-2 text-white/70"
            placeholder="Empty toggle details..."
          />
          {children}
        </div>
      )}
    </div>
  );
};

// Quote Block
export const QuoteBlock = ({ block, onUpdate }: BlockProps) => {
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    console.log("QuoteBlock onChange:", { id: block.id, content });
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative border-l-4 border-gray-500 bg-gray-800/30 py-2 pl-4">
      <EditableContent
        content={textContent}
        onChange={handleChange}
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
// Callout Block
export const CalloutBlock = ({ block, onUpdate }: BlockProps) => {
  const [icon, setIcon] = useState(block.properties?.icon || "💡");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const bgColor = block.properties?.backgroundColor || "bg-blue-900/20";
  const textContent = typeof block.content === "string" ? block.content : "";
  const iconPickerRef = useRef<HTMLDivElement>(null);

  const commonIcons = [
    "💡",
    "⚠️",
    "🚫",
    "✅",
    "🔥",
    "📝",
    "📌",
    "🎉",
    "❤️",
    "⭐",
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        iconPickerRef.current &&
        !iconPickerRef.current.contains(event.target as Node)
      ) {
        setShowIconPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContentChange = (content: string) => {
    onUpdate?.(block.id, content, {
      ...block.properties,
      icon,
      backgroundColor: bgColor,
    });
  };

  const handleIconSelect = (newIcon: string) => {
    setIcon(newIcon);
    setShowIconPicker(false);
    onUpdate?.(block.id, textContent, {
      ...block.properties,
      icon: newIcon,
      backgroundColor: bgColor,
    });
  };

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-lg border border-neutral-700 ${bgColor} p-4`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowIconPicker(!showIconPicker)}
          className="flex h-8 w-8 items-center justify-center rounded text-2xl hover:bg-white/10"
        >
          {icon}
        </button>
        {showIconPicker && (
          <div
            ref={iconPickerRef}
            className="absolute left-0 top-10 z-50 grid w-48 grid-cols-5 gap-2 rounded-lg border border-gray-700 bg-gray-900 p-2 shadow-xl"
          >
            {commonIcons.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleIconSelect(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded text-xl hover:bg-gray-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      <EditableContent
        content={textContent}
        onChange={handleContentChange}
        placeholder="Callout"
        className="flex-1 text-base leading-relaxed text-gray-200"
      />
    </div>
  );
};

// Code Block
export const CodeBlock = ({ block, onUpdate }: BlockProps) => {
  const [language, setLanguage] = useState(
    block.properties?.language || "javascript"
  );
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleContentChange = (content: string) => {
    console.log("CodeBlock onChange:", {
      id: block.id,
      content,
      language,
    });
    onUpdate?.(block.id, content, {
      ...block.properties,
      language,
    });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    console.log("CodeBlock language change:", {
      id: block.id,
      language: newLanguage,
    });
    onUpdate?.(block.id, textContent, {
      ...block.properties,
      language: newLanguage,
    });
  };

  return (
    <div className="group relative my-2 rounded-lg border border-neutral-700">
      <div className="mb-1 flex items-center justify-between rounded-t-lg bg-gray-800 px-3 py-1">
        <select
          value={language}
          onChange={handleLanguageChange}
          className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 outline-none"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="sql">SQL</option>
          <option value="bash">Bash</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-b-lg bg-gray-900 p-4">
        <EditableContent
          content={textContent}
          onChange={handleContentChange}
          placeholder="// code here"
          className="font-mono text-sm leading-relaxed text-green-400"
        />
      </div>
    </div>
  );
};

// Image Block
export const ImageBlock = ({ block, onUpdate }: BlockProps) => {
  const [url, setUrl] = useState(block.content || block.properties?.url || "");
  const [caption, setCaption] = useState(block.properties?.caption || "");
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
  };

  const handleUrlBlur = () => {
    setIsEditingUrl(false);
    console.log("ImageBlock url change:", {
      id: block.id,
      url,
      caption,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      caption,
    });
  };

  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    console.log("ImageBlock caption change:", {
      id: block.id,
      caption: newCaption,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      caption: newCaption,
    });
  };

  if (!url || isEditingUrl) {
    return (
      <div className="my-2 rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30 p-4">
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          onFocus={() => setIsEditingUrl(true)}
          placeholder="Enter image URL..."
          className="w-full bg-transparent text-sm text-gray-200 outline-none"
          autoFocus={isEditingUrl}
        />
      </div>
    );
  }

  return (
    <div className="group relative my-2 border">
      <div
        className="relative h-64 w-full overflow-hidden rounded-lg"
        onClick={() => setIsEditingUrl(true)}
      >
        <Image
          src={url}
          alt={caption || "Image"}
          fill
          className="cursor-pointer object-contain"
        />
      </div>
      <EditableContent
        content={caption}
        onChange={handleCaptionChange}
        placeholder="Add a caption..."
        className="mt-2 text-center text-sm text-gray-400"
      />
    </div>
  );
};

// Video Block
export const VideoBlock = ({ block, onUpdate }: BlockProps) => {
  const [url, setUrl] = useState(block.content || block.properties?.url || "");
  const [caption, setCaption] = useState(block.properties?.caption || "");
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
  };

  const handleUrlBlur = () => {
    setIsEditingUrl(false);
    console.log("VideoBlock url change:", {
      id: block.id,
      url,
      caption,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      caption,
    });
  };

  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    console.log("VideoBlock caption change:", {
      id: block.id,
      caption: newCaption,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      caption: newCaption,
    });
  };

  if (!url || isEditingUrl) {
    return (
      <div className="my-2 rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30 p-4">
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          onFocus={() => setIsEditingUrl(true)}
          placeholder="Enter video URL..."
          className="w-full bg-transparent text-sm text-gray-200 outline-none"
          autoFocus={isEditingUrl}
        />
      </div>
    );
  }

  return (
    <div className="group relative my-2 border">
      <div onClick={() => setIsEditingUrl(true)} className="cursor-pointer">
        <video src={url} controls className="w-full rounded-lg" />
      </div>
      <EditableContent
        content={caption}
        onChange={handleCaptionChange}
        placeholder="Add a caption..."
        className="mt-2 text-center text-sm text-gray-400"
      />
    </div>
  );
};

// Audio Block
export const AudioBlock = ({ block, onUpdate }: BlockProps) => {
  const [url, setUrl] = useState(block.content || block.properties?.url || "");
  const [caption, setCaption] = useState(block.properties?.caption || "");
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
  };

  const handleUrlBlur = () => {
    setIsEditingUrl(false);
    console.log("AudioBlock url change:", {
      id: block.id,
      url,
      caption,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      caption,
    });
  };

  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    console.log("AudioBlock caption change:", {
      id: block.id,
      caption: newCaption,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      caption: newCaption,
    });
  };

  if (!url || isEditingUrl) {
    return (
      <div className="my-2 rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30 p-4">
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          onFocus={() => setIsEditingUrl(true)}
          placeholder="Enter audio URL..."
          className="w-full bg-transparent text-sm text-gray-200 outline-none"
          autoFocus={isEditingUrl}
        />
      </div>
    );
  }

  return (
    <div className="group relative my-2 border">
      <div onClick={() => setIsEditingUrl(true)} className="cursor-pointer">
        <audio src={url} controls className="w-full rounded-lg" />
      </div>
      <EditableContent
        content={caption}
        onChange={handleCaptionChange}
        placeholder="Add a caption..."
        className="mt-2 text-center text-sm text-gray-400"
      />
    </div>
  );
};

// File Block
export const FileBlock = ({ block, onUpdate }: BlockProps) => {
  const [url, setUrl] = useState(block.content || block.properties?.url || "");
  const [fileName, setFileName] = useState(
    block.properties?.fileName || "Download file"
  );
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
  };

  const handleUrlBlur = () => {
    setIsEditingUrl(false);
    console.log("FileBlock url change:", {
      id: block.id,
      url,
      fileName,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      fileName,
    });
  };

  const handleFileNameChange = (newFileName: string) => {
    setFileName(newFileName);
    console.log("FileBlock fileName change:", {
      id: block.id,
      fileName: newFileName,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      fileName: newFileName,
    });
  };

  if (!url || isEditingUrl) {
    return (
      <div className="my-2 rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30 p-4">
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          onFocus={() => setIsEditingUrl(true)}
          placeholder="Enter file URL..."
          className="w-full bg-transparent text-sm text-gray-200 outline-none"
          autoFocus={isEditingUrl}
        />
      </div>
    );
  }

  return (
    <div className="group relative my-2 border">
      <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/30 p-3">
        <svg
          className="h-6 w-6 flex-shrink-0 text-gray-400"
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
        <EditableContent
          content={fileName}
          onChange={handleFileNameChange}
          className="flex-1 text-sm text-gray-200"
        />
        <a
          href={url}
          download
          className="text-xs text-blue-400 hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          Download
        </a>
      </div>
    </div>
  );
};

// Table Block
export const TableBlock = ({ block, onUpdate }: BlockProps) => {
  const tableData =
    typeof block.content === "object" ? block.content : { rows: [[""]] };
  const [rows, setRows] = useState(tableData.rows || [[""]]);

  const handleCellChange = (
    rowIndex: number,
    cellIndex: number,
    value: string
  ) => {
    const newRows = [...rows];
    newRows[rowIndex][cellIndex] = value;
    setRows(newRows);
    console.log("TableBlock cell change:", {
      id: block.id,
      rowIndex,
      cellIndex,
      value,
      rows: newRows,
    });
    onUpdate?.(block.id, { rows: newRows });
  };

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
                  className="min-w-[100px] border-r border-gray-700 p-2 align-top last:border-r-0"
                >
                  <EditableContent
                    content={cell}
                    onChange={(val) =>
                      handleCellChange(rowIndex, cellIndex, val)
                    }
                    className="text-sm text-gray-200"
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
export const BookmarkBlock = ({ block, onUpdate }: BlockProps) => {
  const [url, setUrl] = useState(block.content || block.properties?.url || "");
  const [title, setTitle] = useState(block.properties?.title || "");
  const [description, setDescription] = useState(
    block.properties?.description || ""
  );
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
  };

  const handleUrlBlur = () => {
    setIsEditingUrl(false);
    console.log("BookmarkBlock url change:", {
      id: block.id,
      url,
      title,
      description,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      title,
      description,
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    console.log("BookmarkBlock title change:", {
      id: block.id,
      title: newTitle,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      title: newTitle,
      description,
    });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    console.log("BookmarkBlock description change:", {
      id: block.id,
      description: newDescription,
    });
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      title,
      description: newDescription,
    });
  };

  if (!url || isEditingUrl) {
    return (
      <div className="my-2 rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30 p-4">
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          onFocus={() => setIsEditingUrl(true)}
          placeholder="Enter bookmark URL..."
          className="w-full bg-transparent text-sm text-gray-200 outline-none"
          autoFocus={isEditingUrl}
        />
      </div>
    );
  }

  return (
    <div className="group relative my-2 rounded-lg border border-gray-700 bg-gray-800/30 p-4">
      <EditableContent
        content={title}
        onChange={handleTitleChange}
        placeholder="Bookmark title..."
        className="mb-2 font-medium text-gray-200"
      />
      <EditableContent
        content={description}
        onChange={handleDescriptionChange}
        placeholder="Description..."
        className="mb-2 text-sm text-gray-400"
      />
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate text-xs text-gray-500">{url}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          Visit
        </a>
      </div>
    </div>
  );
};
