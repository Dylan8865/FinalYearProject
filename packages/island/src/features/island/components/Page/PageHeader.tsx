"use client";
import { IslandItemType } from "@/types/types";
import React, {
  Dispatch,
  SetStateAction,
  useRef,
  useLayoutEffect,
  useState,
} from "react";
import Image from "next/image";
import { useIslandItemsContext } from "../../contexts/IslandItemsContext";
import { ImageIcon, X, Upload } from "lucide-react";
import { useToast } from "@/features/island/contexts/ToastContext";
import { useTheme } from "../../contexts/ThemeContext";

interface PageHeaderProps {
  isExpanded: boolean;
  islandItem: IslandItemType | null;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<string | null>>;
}

const PageHeader = ({
  isExpanded,
  islandItem,
  setIsSaving,
  setSaveError,
}: PageHeaderProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";
  const { updateIslandName, uploadIslandCoverImage, removeIslandCoverImage } =
    useIslandItemsContext();
  const { showToast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const title = islandItem?.title || "";

  useLayoutEffect(() => {
    if (titleRef.current) {
      if (!title && document.activeElement !== titleRef.current) {
        titleRef.current.innerHTML = "";
      } else if (
        titleRef.current.innerText !== title &&
        document.activeElement !== titleRef.current
      ) {
        titleRef.current.innerText = title;
      }
    }
  }, [title]);

  const handleTitleChange = (e: React.FormEvent<HTMLHeadingElement>) => {
    if (!islandItem?.id) return;

    if (e.currentTarget.innerText.trim() === "") {
      e.currentTarget.innerHTML = "";
    }

    const newTitle = e.currentTarget.innerText;

    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateIslandName(islandItem.id, newTitle);
      } catch {
        setSaveError("Failed to save title");
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !islandItem?.id) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await uploadIslandCoverImage(islandItem.id, file);
      showToast("Cover image updated successfully", "success");
    } catch (err) {
      console.error("Error uploading image:", err);
      showToast("Failed to upload cover image", "error");
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveCover = async () => {
    if (!islandItem?.id) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await removeIslandCoverImage(islandItem.id);
      showToast("Cover image removed", "info");
    } catch (err) {
      console.error("Error removing cover:", err);
      showToast("Failed to remove cover image", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`group relative flex w-full flex-col items-center justify-center space-y-8 ${isDark ? "text-white" : "text-black"}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {islandItem?.image_cover_path ? (
        <div
          className={`${isExpanded ? "h-[300px]" : "h-[200px]"} relative w-full transition-all duration-300 ease-in-out`}
        >
          <Image
            src={islandItem.image_cover_path}
            alt={islandItem.title || ""}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 rounded bg-black/50 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <Upload className="h-4 w-4" />
              <span>Change cover</span>
            </button>
            <button
              onClick={handleRemoveCover}
              className="flex items-center space-x-2 rounded bg-black/50 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${isExpanded ? "h-[300px]" : "h-[200px]"} relative w-full ${isDark ? "bg-gray-700" : "bg-gray-300"} transition-all duration-300 ease-in-out`}
        >
          <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 rounded bg-black/50 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Add cover</span>
            </button>
          </div>
        </div>
      )}

      <div
        className={`${isExpanded ? "w-full md:w-[40dvw]" : "w-full"} px-6 transition-all duration-300 ease-in-out`}
      >
        <h1
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          className={`min-h-[1.5em] cursor-text break-words text-2xl font-bold outline-none empty:before:text-gray-500 empty:before:content-[attr(data-placeholder)] md:text-3xl lg:text-4xl`}
          data-placeholder="Untitled"
        />
      </div>
    </div>
  );
};

export default PageHeader;
