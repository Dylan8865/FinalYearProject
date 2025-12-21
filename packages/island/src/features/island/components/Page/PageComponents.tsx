"use client";
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ItemDataType, BlockProperties, BlockType } from "@/types/types";
import Image from "next/image";
import { ImageIcon, X, Upload } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

interface BlockProps {
  block: ItemDataType;
  onUpdate?: (id: string, content: any, properties?: BlockProperties) => void;
  onDelete?: (id: string) => void;
  onAddBlock?: (afterId: string, type: BlockType) => void;
  onUploadImage?: (id: string, file: File) => Promise<boolean>;
  onRemoveImage?: (id: string) => Promise<boolean>;
  isEditing?: boolean;
  children?: React.ReactNode;
}

// Editable content component
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
    const { themeColour } = useTheme();
    const isDark = themeColour === "dark";
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      if (ref.current && ref.current.innerText !== content) {
        if (document.activeElement !== ref.current) {
          ref.current.innerText = content;
        }
      }
    }, [content]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const text = e.currentTarget.innerText;
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
        className={`min-h-[1.5em] cursor-text outline-none ${isDark ? "empty:before:text-gray-500" : "empty:before:text-gray-400"} empty:before:content-[attr(data-placeholder)] ${className}`}
        data-placeholder={placeholder}
      />
    );
  }
);
EditableContent.displayName = "EditableContent";

// Paragraph Block
export const ParagraphBlock = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative py-1">
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Type to write..."
        className={`text-base leading-relaxed ${isDark ? "text-gray-200" : "text-gray-800"}`}
      />
    </div>
  );
};

// Heading Blocks
export const Heading1Block = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative py-2">
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Heading 1"
        className={`text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}
      />
    </div>
  );
};

export const Heading2Block = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative py-2">
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Heading 2"
        className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}
      />
    </div>
  );
};

export const Heading3Block = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative py-1">
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Heading 3"
        className={`text-xl font-medium ${isDark ? "text-white" : "text-black"}`}
      />
    </div>
  );
};

// Bulleted List Block
export const BulletedListBlock = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    onUpdate?.(block.id, content);
  };

  return (
    <div className="group relative flex gap-2 py-1">
      <span
        className={`mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isDark ? "bg-gray-400" : "bg-gray-600"}`}
      />
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="List item"
        className={`flex-1 text-base leading-relaxed ${isDark ? "text-gray-200" : "text-gray-800"}`}
      />
    </div>
  );
};

// Todo Block
export const TodoBlock = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
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

  const handleChange = (content: string) => {
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
        className={`mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded ${isDark ? "border-gray-500 bg-transparent text-blue-500" : "border-gray-300 bg-white text-blue-600"} focus:ring-blue-500`}
      />
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="To-do"
        className={`flex-1 text-base leading-relaxed ${checked ? (isDark ? "text-gray-500" : "text-gray-400") + " line-through" : isDark ? "text-gray-200" : "text-gray-800"}`}
      />
    </div>
  );
};

// Toggle Block
export const ToggleBlock = ({ block, onUpdate, children }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const summaryContent = typeof block.content === "string" ? block.content : "";
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
          className={`mt-0.5 flex-shrink-0 ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"} transition-transform`}
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </button>
        <EditableContent
          content={summaryContent}
          onChange={handleSummaryChange}
          placeholder="Toggle list"
          className={`flex-1 text-base leading-relaxed ${isDark ? "text-gray-200" : "text-gray-800"}`}
        />
      </div>
      {isOpen && (
        <div className="ml-6 mt-2">
          <EditableContent
            content={detailsContent}
            onChange={handleDetailsChange}
            className={`mb-2 ${isDark ? "text-white/70" : "text-black/70"}`}
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
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleChange = (content: string) => {
    onUpdate?.(block.id, content);
  };

  return (
    <div
      className={`group relative border-l-4 ${isDark ? "border-gray-500 bg-gray-800/30" : "border-gray-300 bg-gray-100"} py-2 pl-4`}
    >
      <EditableContent
        content={textContent}
        onChange={handleChange}
        placeholder="Quote"
        className={`text-base italic leading-relaxed ${isDark ? "text-white" : "text-black"}`}
      />
    </div>
  );
};

// Divider Block
export const DividerBlock = () => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  return (
    <hr className={`my-4 ${isDark ? "border-gray-700" : "border-gray-200"}`} />
  );
};

// Callout Block
export const CalloutBlock = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const [icon, setIcon] = useState(block.properties?.icon || "💡");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const bgColor =
    block.properties?.backgroundColor ||
    (isDark ? "bg-blue-900/20" : "bg-blue-50");
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
      className={`group relative flex items-center gap-3 rounded-lg border ${isDark ? "border-neutral-700" : "border-neutral-200"} ${bgColor} p-4`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowIconPicker(!showIconPicker)}
          className={`flex h-8 w-8 items-center justify-center rounded text-2xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
        >
          {icon}
        </button>
        {showIconPicker && (
          <div
            ref={iconPickerRef}
            className={`absolute left-0 top-10 z-50 grid w-48 grid-cols-5 gap-2 rounded-lg border ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"} p-2 shadow-xl`}
          >
            {commonIcons.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleIconSelect(emoji)}
                className={`flex h-8 w-8 items-center justify-center rounded text-xl ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
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
        className={`flex-1 text-base leading-relaxed ${isDark ? "text-gray-200" : "text-gray-800"}`}
      />
    </div>
  );
};

// Code Block
export const CodeBlock = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const [language, setLanguage] = useState(
    block.properties?.language || "javascript"
  );
  const textContent = typeof block.content === "string" ? block.content : "";

  const handleContentChange = (content: string) => {
    onUpdate?.(block.id, content, {
      ...block.properties,
      language,
    });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    onUpdate?.(block.id, textContent, {
      ...block.properties,
      language: newLanguage,
    });
  };

  return (
    <div
      className={`group relative my-2 rounded-lg border ${isDark ? "border-neutral-700" : "border-neutral-200"}`}
    >
      <div
        className={`mb-1 flex items-center justify-between rounded-t-lg ${isDark ? "bg-gray-800" : "bg-gray-100"} px-3 py-1`}
      >
        <select
          value={language}
          onChange={handleLanguageChange}
          className={`rounded ${isDark ? "bg-gray-700 text-gray-300" : "bg-white text-gray-700"} px-2 py-1 text-xs outline-none`}
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
      <div
        className={`overflow-x-auto rounded-b-lg ${isDark ? "bg-gray-900" : "bg-white"} p-4`}
      >
        <EditableContent
          content={textContent}
          onChange={handleContentChange}
          placeholder="// code here"
          className={`font-mono text-sm leading-relaxed ${isDark ? "text-green-400" : "text-green-600"}`}
        />
      </div>
    </div>
  );
};

// Image Block
export const ImageBlock = ({
  block,
  onUpdate,
  onUploadImage,
  onRemoveImage,
}: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const [url, setUrl] = useState(
    typeof block.content === "string" ? block.content : ""
  );
  const [caption, setCaption] = useState(block.properties?.caption || "");
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(typeof block.content === "string" ? block.content : "");
  }, [block.content]);

  useEffect(() => {
    setCaption(block.properties?.caption || "");
  }, [block.properties?.caption]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleUrlBlur = () => {
    setIsEditingUrl(false);
    onUpdate?.(block.id, url, {
      ...block.properties,
      caption,
    });
  };

  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    onUpdate?.(block.id, url, {
      ...block.properties,
      caption: newCaption,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;

    try {
      await onUploadImage(block.id, file);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!onRemoveImage) return;
    try {
      await onRemoveImage(block.id);
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  if (!url || isEditingUrl) {
    return (
      <div
        className={`group relative my-2 rounded-lg border-2 border-dashed ${isDark ? "border-gray-700 bg-gray-800/20 hover:border-gray-500 hover:bg-gray-800/30" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"} p-8 transition-colors`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`flex w-full max-w-md items-center gap-2 rounded border ${isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-white"} p-2`}
          >
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              onBlur={handleUrlBlur}
              onFocus={() => setIsEditingUrl(true)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlBlur()}
              placeholder="Paste an image link..."
              className={`flex-1 bg-transparent text-sm ${isDark ? "text-gray-200" : "text-gray-800"} outline-none`}
              autoFocus={isEditingUrl}
            />
          </div>
          <div
            className={`flex items-center gap-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            <span className="text-xs font-medium uppercase tracking-wider">
              Or
            </span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 rounded-md ${isDark ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} px-4 py-2 text-sm font-medium transition-colors`}
          >
            <Upload className="h-4 w-4" />
            Upload File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative my-4 flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <div
        className={`group/img relative flex min-h-[100px] w-full items-center justify-center overflow-hidden rounded-lg ${isDark ? "bg-neutral-900/50" : "bg-neutral-100"}`}
      >
        <div className="relative flex h-full max-h-[60vh] w-full items-center justify-center">
          <img
            src={url}
            alt={caption || "Image"}
            className="h-auto max-h-[60vh] w-auto max-w-full object-contain"
          />
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity group-hover/img:opacity-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur transition-colors hover:bg-black/80"
            title="Change image"
          >
            <Upload className="h-3.5 w-3.5" />
            Change
          </button>
          <button
            onClick={() => setIsEditingUrl(true)}
            className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur transition-colors hover:bg-black/80"
            title="Edit URL"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            URL
          </button>
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur transition-colors hover:bg-black/80"
            title="Remove image"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>
      <EditableContent
        content={caption}
        onChange={handleCaptionChange}
        placeholder="Add a caption..."
        className={`mt-3 w-full max-w-2xl text-center text-sm ${isDark ? "text-gray-500 hover:text-gray-400 focus:text-gray-300" : "text-gray-400 hover:text-gray-500 focus:text-gray-600"}`}
      />
    </div>
  );
};

// Bookmark Block
export const BookmarkBlock = ({ block, onUpdate }: BlockProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const [url, setUrl] = useState(block.content || block.properties?.url || "");
  const [title, setTitle] = useState(block.properties?.title || "");
  const [description, setDescription] = useState(
    block.properties?.description || ""
  );
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleUrlBlur = () => {
    setIsEditingUrl(false);
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      title,
      description,
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      title: newTitle,
      description,
    });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    onUpdate?.(block.id, url, {
      ...block.properties,
      url,
      title,
      description: newDescription,
    });
  };

  if (!url || isEditingUrl) {
    return (
      <div
        className={`my-2 rounded-lg border-2 border-dashed ${isDark ? "border-gray-700 bg-gray-800/30" : "border-gray-300 bg-gray-50"} p-4`}
      >
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          onFocus={() => setIsEditingUrl(true)}
          placeholder="Enter bookmark URL..."
          className={`w-full bg-transparent text-sm ${isDark ? "text-gray-200" : "text-gray-800"} outline-none`}
          autoFocus={isEditingUrl}
        />
      </div>
    );
  }

  return (
    <div
      className={`group relative my-2 rounded-lg border ${isDark ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-gray-50"} p-4`}
    >
      <EditableContent
        content={title}
        onChange={handleTitleChange}
        placeholder="Bookmark title..."
        className={`mb-2 font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}
      />
      <EditableContent
        content={description}
        onChange={handleDescriptionChange}
        placeholder="Description..."
        className={`mb-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
      />
      <div className="flex items-center gap-2">
        <p
          className={`flex-1 truncate text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          {url}
        </p>
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
