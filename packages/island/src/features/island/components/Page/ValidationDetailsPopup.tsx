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
  validationStatus?: "pending" | "completed" | "error" | null;
  onPublish?: () => void;
  onAppeal?: () => void;
  isExpanded: boolean;
}

const ValidationDetailsPopup = ({
  isOpen,
  onClose,
  islandItemId,
  status,
  validationStatus,
  onPublish,
  onAppeal,
  isExpanded,
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
        itemData: itemDataList.map(
          (data: {
            id: string;
            validity: number | null;
            type: string | null;
          }) => ({
            id: data.id,
            validity: data.validity,
            type: data.type,
          })
        ),
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
      className={
        isExpanded
          ? "fixed bottom-1/2 right-1/2 z-50 h-fit max-h-[60dvh] w-5/6 translate-x-[50%] translate-y-[50%] overflow-y-scroll rounded-lg border border-gray-700 bg-[#242424] transition-all duration-500 md:bottom-6 md:right-6 md:w-[30dvw] md:translate-x-0 md:translate-y-0"
          : `fixed top-1/2 z-50 h-fit max-h-[60dvh] w-80 overflow-y-scroll rounded-lg border border-gray-700 bg-[#242424] shadow-2xl transition-all duration-500 md:top-0 md:h-full md:max-h-none md:rounded-none ${
              isOpen
                ? "right-1/2 translate-x-[50%] translate-y-[-50%] md:right-[34dvw] md:translate-x-0 md:translate-y-0"
                : "-right-80 rounded-lg"
            }`
      }
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-white">
            Validation Details
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
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
          ) : status === "pending" ? (
            validationStatus === "pending" ? (
              // AI Validation in progress
              <div className="space-y-4">
                <div className="rounded-lg bg-yellow-900/30 border border-yellow-600/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-600">
                      <LoadingIcon className="!h-5 !w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        AI Validation in Progress
                      </h3>
                      <p className="text-xs text-yellow-200">
                        Currently queued for AI validation
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">
                    Your content has been submitted and is waiting to be processed by our AI validation system. This typically takes a few moments.
                  </p>
                </div>

                <div className="rounded-lg bg-gray-800 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-300">
                    What's happening now:
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                      <div>
                        <p className="text-sm font-medium text-white">Queued</p>
                        <p className="text-xs text-gray-400">
                          Your content is in the validation queue
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-gray-600"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">
                          AI Analysis
                        </p>
                        <p className="text-xs text-gray-400">
                          Evaluating clarity, completeness, usefulness, and authenticity
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-gray-600"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">
                          Results
                        </p>
                        <p className="text-xs text-gray-400">
                          Scores and feedback will appear here
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Moderator Review pending
              <div className="space-y-4">
                <div className="rounded-lg bg-yellow-900/30 border border-yellow-600/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-600">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        Awaiting Moderator Review
                      </h3>
                      <p className="text-xs text-yellow-200">
                        Your content is being reviewed by our moderators
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">
                    Your content has been flagged for manual review. Our moderators will assess it and make a final decision soon.
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingIcon className="!h-6 !w-6" />
                  </div>
                ) : validationData ? (
                  <>
                    {/* Overall Validity */}
                    <div className="rounded-lg bg-gray-800 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-gray-400">
                        AI Validation Score
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
                  </>
                ) : null}

                <div className="rounded-lg bg-gray-800 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-300">
                    Why is this being reviewed?
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Content may be flagged for moderator review when:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>AI validation score is borderline (55-59)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>Content contains sensitive or unusual topics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>You appealed a previous decision</span>
                    </li>
                  </ul>
                </div>
              </div>
            )
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
