"use client";

import PageControls from "./PageControls";
import PageHeader from "./PageHeader";
import ValidationDetailsPopup from "./ValidationDetailsPopup";
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
  itemName: _itemName,
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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"unverified" | "pending" | "declined" | "verified">("unverified");
  const { showToast } = useToast();

  const isSaving = isHeaderSaving || isEditorSaving;

  // Fetch current validation status when opening popup
  const fetchCurrentStatus = useCallback(async () => {
    if (!islandItem?.id) return;
    try {
      const response = await fetch(`/api/island-items?id=${islandItem.id}`);
      const data = await response.json();
      console.log("Fetched island item data:", data);
      const item = Array.isArray(data) ? data[0] : data;
      console.log("Status:", item.status);
      setCurrentStatus((item.status || "unverified") as "unverified" | "pending" | "declined" | "verified");
    } catch (error) {
      console.error("Failed to fetch validation status:", error);
    }
  }, [islandItem?.id]);

  // Update status when island item changes
  useEffect(() => {
    if (islandItem?.id) {
      fetchCurrentStatus();
    }
  }, [islandItem?.id, fetchCurrentStatus]);

  // Handle publish - queue validation after ensuring saves are complete
  const handlePublish = useCallback(async () => {
    if (!islandItem?.id) return;

    // Check if currently saving
    if (isSaving) {
      showToast("Please wait for current changes to save", "info");
      return;
    }

    try {
      const response = await fetch("/api/validate-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ islandItemId: islandItem.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to publish");
      }

      showToast(
        "Published! Your content is queued for validation.",
        "success"
      );
      setIsPopupOpen(false); // Close popup after successful publish
    } catch (error) {
      console.error("Publish error:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to publish. Ensure your item has a title and content.",
        "error"
      );
    }
  }, [islandItem?.id, isSaving, showToast]);

  // Handle appeal - set status back to pending
  const handleAppeal = useCallback(async () => {
    if (!islandItem?.id) return;

    try {
      const response = await fetch(`/api/island-items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: islandItem.id,
          status: "pending",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit appeal");
      }

      showToast("Appeal submitted! Your content will be reviewed.", "success");
      setIsPopupOpen(false); // Close popup after successful appeal
      
      // Refresh status
      fetchCurrentStatus();
    } catch (error) {
      console.error("Appeal error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to submit appeal",
        "error"
      );
    }
  }, [islandItem?.id, showToast, fetchCurrentStatus]);

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
          status={currentStatus}
          onStatusClick={() => {
            fetchCurrentStatus();
            setIsPopupOpen(true);
          }}
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
          status={currentStatus}
          onStatusClick={() => {
            fetchCurrentStatus();
            setIsPopupOpen(true);
          }}
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
      className={`${isExpanded ? "w-full" : "w-4/5 md:w-[34dvw]"} absolute right-0 top-0 z-50 flex h-full flex-col bg-[#191919] transition-all duration-300 ease-in-out`}
      style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
    >
      <PageControls
        onClick={onClick}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isSaving={isSaving}
        saveError={saveError}
        status={currentStatus}
        onStatusClick={() => {
          fetchCurrentStatus();
          setIsPopupOpen(true);
        }}
      />

      {/* Validation Details Popup */}
      <ValidationDetailsPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        islandItemId={islandItem?.id || ""}
        status={currentStatus}
        onPublish={handlePublish}
        onAppeal={handleAppeal}
      />

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto">
        {/* Page Header */}
        <PageHeader
          isExpanded={isExpanded}
          islandItem={islandItem}
          setIsSaving={setIsHeaderSaving}
          setSaveError={setSaveError}
        />

        {/* Block Editor */}
        <div className="max-w-4/5 px-4 pb-96 md:max-w-[34dvw]">
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
    </div>
  );
};

export default SidebarPage;
