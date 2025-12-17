import { IslandItemType } from "@/types/types";
import React, { Dispatch, SetStateAction, useRef } from "react";
import Image from "next/image";
import { useIslandItems } from "../../hooks/useIslandItems";

interface PageHeaderProps {
  islandItem: IslandItemType | null;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<string | null>>;
}

const PageHeader = ({
  islandItem,
  setIsSaving,
  setSaveError,
}: PageHeaderProps) => {
  const { updateIslandName } = useIslandItems();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitleChange = (e: React.FormEvent<HTMLHeadingElement>) => {
    if (!islandItem?.id) return;

    const title = e.currentTarget.innerText;

    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateIslandName(islandItem.id, title);
      } catch {
        setSaveError("Failed to save title");
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  return (
    <div className="w-full space-y-4 border-b text-white">
      {islandItem?.cover_image ? (
        <div className="relative h-[200px] w-full">
          <Image
            src={islandItem.cover_image}
            alt={islandItem.title || ""}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-[200px] w-full bg-gray-700" />
      )}

      <div className="px-6">
        <h1
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleChange}
          className="text-3xl font-bold outline-none"
        >
          {islandItem?.title || "Untitled"}
        </h1>
      </div>
    </div>
  );
};

export default PageHeader;
