import { IslandItemType } from "@/types/types";
import React, {
  Dispatch,
  SetStateAction,
  useRef,
  useLayoutEffect,
} from "react";
import Image from "next/image";
import { useIslandItems } from "../../hooks/useIslandItems";

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
  const { updateIslandName } = useIslandItems();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const title = islandItem?.title || "";

  useLayoutEffect(() => {
    if (titleRef.current) {
      if (!title && document.activeElement !== titleRef.current) {
        // Force clear to ensure :empty works
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

    // Force clear DOM if text is empty to ensure :empty works
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

  return (
    <div className="w-full space-y-4 text-white">
      {islandItem?.cover_image ? (
        <div
          className={`${isExpanded ? "h-[300px]" : "h-[200px]"} relative w-full transition-all duration-300 ease-in-out`}
        >
          <Image
            src={islandItem.cover_image}
            alt={islandItem.title || ""}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className={`${isExpanded ? "h-[300px]" : "h-[200px]"} w-full bg-gray-700 transition-all duration-300 ease-in-out`}
        />
      )}

      <div className="px-6">
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
          className="min-h-[1.5em] cursor-text truncate text-5xl font-bold outline-none empty:before:text-gray-500 empty:before:content-[attr(data-placeholder)]"
          data-placeholder="Untitled"
        />
      </div>
    </div>
  );
};

export default PageHeader;
