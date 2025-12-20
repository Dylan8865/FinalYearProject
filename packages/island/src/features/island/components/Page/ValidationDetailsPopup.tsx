"use client";

import React, { useEffect, useState, useCallback } from "react";
import CloseIcon from "@/icons/CloseIcon";
import LoadingIcon from "@/icons/LoadingIcon";

interface ItemDataValidation {
  id: string;
  validity: number | null;
  type: string | null;
}

interface ValidationDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  islandItemId: string;
  status: "unverified" | "pending" | "declined" | "verified";
  onPublish?: () => void;
  onAppeal?: () => void;
}

const ValidationDetailsPopup = ({
  isOpen,
  onClose,
  islandItemId,
  status,
  onPublish,
  onAppeal,
}: ValidationDetailsPopupProps) => {
  const [loading, setLoading] = useState(false);
  const [validationData, setValidationData] = useState<{
    validity: number | null;
    comment: string | null;
    itemData: ItemDataValidation[];
  } | null>(null);

  const fetchValidationData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch island item
      const itemResponse = await fetch(`/api/island-items?id=${islandItemId}`);
      const itemData = await itemResponse.json();
      const item = Array.isArray(itemData) ? itemData[0] : itemData;

      // Fetch item-data
      const dataResponse = await fetch(
        `/api/item-data?island_item_id=${islandItemId}`
      );
      const itemDataList = await dataResponse.json();

      setValidationData({
        validity: item.validity,
        comment: item.comment,
        itemData: itemDataList.map((data: { id: string; validity: number | null; type: string | null }) => ({
          id: data.id,
          validity: data.validity,
          type: data.type,
        })),
      });
    } catch (error) {
      console.error("Failed to fetch validation data:", error);
    } finally {
      setLoading(false);
    }
  }, [islandItemId]);

  useEffect(() => {
    if (isOpen && islandItemId && status !== "unverified") {
      fetchValidationData();
    }
  }, [isOpen, islandItemId, status, fetchValidationData]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 z-[45] h-full w-80 bg-[#242424] shadow-2xl transition-all duration-300 ${
        isOpen ? "right-[80%] md:right-[34dvw]" : "-right-80"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-white">
            Validation Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {status === "unverified" ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-800 p-4">
                <h3 className="mb-2 font-semibold text-white">
                  Ready to Publish?
                </h3>
                <p className="mb-4 text-sm text-gray-300">
                  Your content hasn't been published yet. Click the button below
                  to submit it for AI validation.
                </p>
                <button
                  onClick={onPublish}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Publish for Validation
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <p className="font-semibold text-gray-300">How it works:</p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>Your content is queued for validation</li>
                  <li>
                    AI evaluates clarity, completeness, usefulness, and
                    authenticity
                  </li>
                  <li>
                    Results appear within minutes with scores and feedback
                  </li>
                  <li>
                    Content is auto-published (60+), flagged for review (55-59),
                    or declined (&lt;55)
                  </li>
                </ol>
              </div>
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingIcon className="!h-8 !w-8" />
            </div>
          ) : validationData ? (
            <div className="space-y-4">
              {/* Overall Validity */}
              <div className="rounded-lg bg-gray-800 p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-400">
                  Overall Validity
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className={`text-3xl font-bold ${
                      (validationData.validity ?? 0) >= 60
                        ? "text-green-500"
                        : (validationData.validity ?? 0) >= 55
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {validationData.validity?.toFixed(2) ?? "N/A"}
                  </div>
                  <div className="text-sm text-gray-400">/ 100</div>
                </div>
              </div>

              {/* AI Comment */}
              {validationData.comment && (
                <div className="rounded-lg bg-gray-800 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-400">
                    AI Feedback
                  </h3>
                  <p className="text-sm text-gray-300">
                    {validationData.comment}
                  </p>
                </div>
              )}

              {/* Item Data Validities */}
              {validationData.itemData.length > 0 && (
                <div className="rounded-lg bg-gray-800 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-400">
                    Content Block Scores
                  </h3>
                  <div className="space-y-2">
                    {validationData.itemData.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded bg-gray-900 p-2"
                      >
                        <span className="text-xs text-gray-400">
                          Block {index + 1} ({item.type || "unknown"})
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            (item.validity ?? 0) >= 60
                              ? "text-green-500"
                              : (item.validity ?? 0) >= 55
                                ? "text-yellow-500"
                                : "text-red-500"
                          }`}
                        >
                          {item.validity?.toFixed(0) ?? "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appeal Button for Declined */}
              {status === "declined" && onAppeal && (
                <button
                  onClick={onAppeal}
                  className="w-full rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                >
                  Appeal Decision
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-400">
              No validation data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationDetailsPopup;
