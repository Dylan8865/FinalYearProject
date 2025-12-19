"use client";

import PageControls from "./PageControls";
import PageHeader from "./PageHeader";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useToast } from "../../contexts/ToastContext";
import { useIslandItemsContext } from "../../contexts/IslandItemsContext";
import { useItemData } from "../../hooks/useItemData";
import { BlockEditorContainer } from "../NotionBlock";
import LoadingScreen from "../Shared/LoadingScreen";

interface SidebarPageProps {
  isOpen?: boolean;
  itemId?: string;
  itemName?: string;
  onClick?: () => void;
}

const SidebarPage = ({
  isOpen,
  itemId,
  itemName,
  onClick,
}: SidebarPageProps) => {
  const { islandItems } = useIslandItemsContext();

  const islandItem = useMemo(() => {
    if (!itemId || itemId.length === 0) return null;
    return islandItems.find((item) => item.id === itemId) ?? null;
  }, [islandItems, itemId]);

  const {
    data: itemData,
    loading,
    error,
    refetch,
  } = useItemData(islandItem?.id);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isHeaderSaving, setIsHeaderSaving] = useState(false);
  const [isEditorSaving, setIsEditorSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { showToast } = useToast();

  const isSaving = isHeaderSaving || isEditorSaving;

  // Global keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl + S (Force Save)
      if (cmdOrCtrl && e.key === "s") {
        e.preventDefault();
        // The save is already handled optimistically/background,
        // but this shows intent and provides assurance.
        showToast("Changes saved", "success");
      }

      // Ctrl + Enter (Toggle Fullscreen)
      if (cmdOrCtrl && e.key === "Enter") {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }

      // Escape (Close or Minimize)
      if (e.key === "Escape") {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          onClick?.();
        }
      }
    },
    [isOpen, isExpanded, onClick, showToast]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (loading) {
    return (
      <div
        className="absolute right-0 top-0 z-50 flex h-full w-4/5 flex-col bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <PageControls
          onClick={onClick}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          isSaving={isSaving}
          saveError={saveError}
        />
        <div className="flex flex-1 items-center justify-center">
          <LoadingScreen width="w-full" height="h-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="absolute right-0 top-0 z-50 flex h-full w-4/5 flex-col bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <PageControls
          onClick={onClick}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          isSaving={isSaving}
          saveError={saveError}
        />

        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="text-red-400">Error: {error}</div>
          <button
            onClick={refetch}
            className="mt-2 rounded-md bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isExpanded ? "w-full" : "w-4/5 md:w-[34dvw]"} absolute right-0 top-0 z-50 flex h-full flex-col items-center justify-center overflow-y-auto bg-[#191919] pb-96 transition-all duration-300 ease-in-out`}
      style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
    >
      <PageControls
        onClick={onClick}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isSaving={isSaving}
        saveError={saveError}
      />

      {/* Page Header */}
      <PageHeader
        isExpanded={isExpanded}
        islandItem={islandItem}
        setIsSaving={setIsHeaderSaving}
        setSaveError={setSaveError}
      />

      {/* Block Editor */}
      <div className="max-w-4/5 px-4 md:max-w-[34dvw]">
        {islandItem && (
          <BlockEditorContainer
            islandItemId={islandItem.id}
            initialBlocks={itemData || []}
            onRefetch={refetch}
            onSavingChange={setIsEditorSaving}
          />
        )}
      </div>
    </div>
  );
};

export default SidebarPage;
