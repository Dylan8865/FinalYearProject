"use client";

import { useState, useEffect, useCallback } from "react";
import { updateIslandItemStatus, getItemDataByIslandItemId } from "@/actions/knowledge";

interface IslandItem {
  id: string;
  created_at: string;
  title: string | null;
  image_cover_path: string | null;
  status: string | null;
  validity: number | null;
  comment: string | null;
  validation_status: string | null;
  admin_comment: string | null;
  profile?: {
    name: string | null;
    email: string | null;
  };
}

interface ItemData {
  id: string;
  type: string | null;
  content: any;
  order_index: number | null;
  validity: number | null;
  properties: any;
}

interface KnowledgeDetailViewProps {
  item: IslandItem;
  onClose: () => void;
  onUpdate: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function KnowledgeDetailView({ 
  item, 
  onClose, 
  onUpdate,
  onError,
  onSuccess
}: KnowledgeDetailViewProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [itemData, setItemData] = useState<ItemData[]>([]);
  const [adminComment, setAdminComment] = useState(item.admin_comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showBlockScores, setShowBlockScores] = useState(false);
  const [commentError, setCommentError] = useState("");

  const currentStatus = (item.validation_status === "pending" ? "pending" : item.status) as "unverified" | "pending" | "declined" | "verified";

  // Fetch item data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getItemDataByIslandItemId(item.id);
        setItemData(data);
      } catch (error) {
        onError("Failed to load content blocks");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [item.id]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async (newStatus: "verified" | "declined" | "pending") => {
    if (newStatus !== "pending" && !adminComment.trim()) {
      setCommentError("Comments are required before updating status");
      return;
    }

    setIsSubmitting(true);
    setCommentError("");
    try {
      await updateIslandItemStatus(item.id, newStatus, adminComment.trim());
      onSuccess(`Status updated to ${newStatus}`);
      setIsPopupOpen(false);
      onUpdate();
    } catch (error: any) {
      onError(error.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBlockContent = (block: ItemData) => {
    const content = typeof block.content === "string" ? block.content : "";
    const properties = block.properties || {};
    
    switch (block.type) {
      case "heading_1":
      case "heading1":
        return (
          <div className="group relative py-2">
            <div className="text-3xl font-bold text-white">
              {content || ""}
            </div>
          </div>
        );
      case "heading_2":
      case "heading2":
        return (
          <div className="group relative py-2">
            <div className="text-2xl font-semibold text-white">
              {content || ""}
            </div>
          </div>
        );
      case "heading_3":
      case "heading3":
        return (
          <div className="group relative py-1">
            <div className="text-xl font-medium text-white">
              {content || ""}
            </div>
          </div>
        );
      case "paragraph":
        return (
          <div className="group relative py-1">
            <div className="text-base leading-relaxed text-gray-200">
              {content || ""}
            </div>
          </div>
        );
      case "bulleted_list":
      case "bulletList":
        return (
          <div className="group relative flex gap-2 py-1">
            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
            <div className="flex-1 text-base leading-relaxed text-gray-200">
              {content || ""}
            </div>
          </div>
        );
      case "numbered_list":
      case "numberedList":
        return (
          <div className="group relative flex gap-2 py-1">
            <span className="text-base leading-relaxed text-gray-400">•</span>
            <div className="flex-1 text-base leading-relaxed text-gray-200">
              {content || ""}
            </div>
          </div>
        );
      case "todo":
        const checked = properties.checked || false;
        return (
          <div className="group relative flex gap-2 py-1">
            <input
              type="checkbox"
              checked={checked}
              disabled
              className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-500 bg-transparent text-[#C8C8C8]"
            />
            <div className={`flex-1 text-base leading-relaxed ${checked ? "text-gray-500 line-through" : "text-gray-200"}`}>
              {content || ""}
            </div>
          </div>
        );
      case "toggle":
        return (
          <div className="group relative py-1">
            <div className="flex gap-2">
              <span className="mt-0.5 flex-shrink-0 text-gray-400">▶</span>
              <div className="flex-1 text-base leading-relaxed text-gray-200">
                {content || ""}
              </div>
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="group relative border-l-4 border-gray-500 bg-gray-800/30 py-2 pl-4">
            <div className="text-base italic leading-relaxed text-white">
              {content || ""}
            </div>
          </div>
        );
      case "divider":
        return <hr className="my-4 border-gray-700" />;
      case "callout":
        const icon = properties.icon || "💡";
        const bgColor = properties.backgroundColor || "bg-[#1E1E1E]";
        return (
          <div className={`group relative flex items-center gap-3 rounded-lg border border-neutral-700 ${bgColor} p-4`}>
            <div className="flex h-8 w-8 items-center justify-center text-2xl">
              {icon}
            </div>
            <div className="flex-1 text-base leading-relaxed text-gray-200">
              {content || ""}
            </div>
          </div>
        );
      case "code":
        const language = properties.language || "javascript";
        return (
          <div className="group relative my-2 rounded-lg border border-neutral-700">
            <div className="mb-1 flex items-center justify-between rounded-t-lg bg-gray-800 px-3 py-1">
              <span className="text-xs text-gray-300">{language}</span>
            </div>
            <div className="overflow-x-auto rounded-b-lg bg-[#1E1E1E] p-4">
              <pre className="font-mono text-sm leading-relaxed text-green-400">
                {content || ""}
              </pre>
            </div>
          </div>
        );
      case "image":
        const imageUrl = typeof block.content === "string" ? block.content : "";
        const caption = properties.caption || "";
        return (
          <div className="group relative my-2">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={caption || "Image"}
                className="max-w-full rounded-lg"
              />
            )}
            {caption && (
              <div className="mt-2 text-center text-sm italic text-gray-400">
                {caption}
              </div>
            )}
          </div>
        );
      case "bookmark":
        const bookmarkUrl = properties.url || "";
        const bookmarkTitle = properties.title || "";
        const bookmarkDescription = properties.description || "";
        return (
          <a
            href={bookmarkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative my-2 flex flex-col rounded-lg border border-gray-700 bg-gray-800/30 p-4 transition-colors hover:border-gray-500 hover:bg-gray-800/50"
          >
            <div className="text-base font-medium text-[#E0E0E0] break-words">
              {bookmarkTitle || bookmarkUrl}
            </div>
            {bookmarkDescription && (
              <div className="mt-1 text-sm text-gray-400 break-words">
                {bookmarkDescription}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500 break-all overflow-hidden">{bookmarkUrl}</div>
          </a>
        );
      default:
        return (
          <div className="group relative py-1">
            <div className="text-base leading-relaxed text-gray-200">
              {content || ""}
            </div>
          </div>
        );
    }
  };

  const statusConfig = {
    unverified: {
      color: "bg-gray-600",
      text: "Unverified",
      textColor: "text-gray-300",
    },
    pending: {
      color: "bg-yellow-500",
      text: "Pending",
      textColor: "text-yellow-100",
    },
    declined: {
      color: "bg-red-500",
      text: "Declined",
      textColor: "text-red-100",
    },
    verified: {
      color: "bg-green-500",
      text: "Verified",
      textColor: "text-green-100",
    },
  };

  const config = statusConfig[currentStatus] || statusConfig.unverified;
  const canModerate = item.status === "pending" || item.status === "verified" || item.status === "declined";

  return (
    <>
      <div
        className="w-full fixed right-0 top-0 z-50 flex h-full flex-col bg-[#191919] transition-all duration-300 ease-in-out"
      >
        {/* Page Controls */}
        <div className="sticky top-0 z-50 flex w-full items-center justify-between bg-[#191919]">
          <div className="flex items-center justify-start gap-3 p-3 text-base md:text-xs">
            <button
              className="flex items-center justify-center text-white hover:text-gray-300 transition-colors"
              onClick={onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              className="flex h-[16px] items-center gap-1.5 rounded bg-gray-800 px-2 text-[10px] leading-none hover:bg-gray-700"
              onClick={() => setIsPopupOpen(true)}
              title="View validation details"
            >
              <div className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
              <span className={config.textColor}>{config.text}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex flex-col items-center overflow-y-scroll">
          {/* Page Header */}
          <div className="group relative flex w-full flex-col items-center justify-center space-y-8 text-white">
            {/* Cover Image */}
            {item.image_cover_path ? (
              <div className="h-[300px] relative w-full transition-all duration-300 ease-in-out">
                <img
                  src={item.image_cover_path}
                  alt={item.title || ""}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-[300px] relative w-full bg-gray-700 transition-all duration-300 ease-in-out" />
            )}

            {/* Title */}
            <div className="w-full md:w-[40dvw] px-6 transition-all duration-300 ease-in-out">
              <h1 className="min-h-[1.5em] cursor-text break-words text-2xl font-bold outline-none md:text-3xl lg:text-4xl text-white">
                {item.title || "Untitled"}
              </h1>
              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                <span>Created by: {item.profile?.name || "Unknown"}</span>
                <span>•</span>
                <span>Created on: {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              {/* Island Item ID */}
              <div className="mt-2 mb-6">
                <button
                  onClick={() => handleCopyId(item.id)}
                  className="text-xs text-gray-500 hover:text-gray-300 font-mono bg-gray-800/50 hover:bg-gray-800 px-2 py-1 rounded transition-colors cursor-pointer"
                  title="Click to copy Island Item ID"
                >
                  {copiedId === item.id ? "Island Item ID Copied!" : `Island Item ID: ${item.id}`}
                </button>
              </div>
            </div>
          </div>

          {/* Content Blocks */}
          <div className="w-full px-4 pb-96 md:max-w-[34dvw]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : itemData.length > 0 ? (
              <div className="space-y-2">
                {itemData.map((block, index) => (
                  <div key={block.id} className="relative group flex gap-3 border border-transparent hover:border-gray-700 rounded-lg p-2 transition-colors">
                    {/* Block Info Badges - Left Side */}
                    <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity min-w-[80px]">
                      <button
                        onClick={() => handleCopyId(block.id)}
                        className="text-[10px] text-gray-400 hover:text-white font-mono bg-gray-800/80 px-1.5 py-0.5 rounded text-left transition-colors cursor-pointer truncate"
                        title="Click to copy full item-data ID"
                      >
                        {copiedId === block.id ? "Copied!" : `${block.id.slice(0, 8)}...`}
                      </button>
                      <span className="text-[10px] text-gray-500 font-mono bg-gray-800/80 px-1.5 py-0.5 rounded truncate" title={block.type || "unknown"}>
                        {block.type}
                      </span>
                      {block.order_index !== null && (
                        <span className="text-[10px] text-gray-500 font-mono bg-gray-800/80 px-1.5 py-0.5 rounded">
                          Order: {block.order_index}
                        </span>
                      )}
                    </div>
                    
                    {/* Block Content */}
                    <div className="flex-1 min-w-0">
                      {renderBlockContent(block)}
                    </div>

                    {/* Validity Score - Right Side */}
                    {block.validity !== null && block.validity !== undefined && (
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                            block.validity >= 60
                              ? "bg-green-500/20 text-green-300"
                              : block.validity >= 55
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {block.validity.toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No content available</p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Details Popup */}
      <div
        className={`fixed z-50 border border-gray-700 bg-[#242424] transition-all duration-500 ease-in-out ${
          isPopupOpen
            ? "bottom-1/2 right-1/2 h-fit max-h-[60dvh] w-5/6 translate-x-[50%] translate-y-[50%] overflow-y-auto md:bottom-6 md:right-6 md:w-[30dvw] md:translate-x-0 md:translate-y-0 rounded-lg"
            : "bottom-0 right-0 w-full md:w-96 md:right-6 rounded-t-lg overflow-hidden max-h-[48px]"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div 
            className="flex items-center justify-between border-b border-gray-700 bg-[#242424] cursor-pointer hover:bg-gray-800/50 transition-colors p-3"
            onClick={() => setIsPopupOpen(!isPopupOpen)}
          >
            <h2 className="font-semibold text-white text-base">
              Validation Details
            </h2>
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPopupOpen ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
              </svg>
            </button>
        </div>

          {/* Content */}
          <div className={`flex-1 overflow-y-auto p-4 transition-opacity duration-500 ${
            isPopupOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}>
            {(item.status === "unverified" || (item.status === "pending" && item.validation_status === "pending")) ? (
                <div className="rounded-lg bg-yellow-900/30 border border-yellow-600/50 p-4">
                  <h3 className="font-semibold text-white mb-2">
                    {item.status === "unverified" ? "Unverified Content" : "AI Validation in Progress"}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {item.status === "unverified"
                      ? "This content has not been published for validation yet."
                      : "This content is currently being processed by the AI validation system."}
                  </p>
                </div>
              ) : canModerate ? (
                <div className="space-y-4">
                  {/* Overall Validity */}
                  <div className="rounded-lg bg-[#282828] border border-[#3B3B3B] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-gray-400">
                      Overall Validity Score
                    </h3>
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-3xl font-bold ${
                          (item.validity ?? 0) >= 60
                            ? "text-green-500"
                            : (item.validity ?? 0) >= 55
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {item.validity?.toFixed(2) ?? "N/A"}
                      </div>
                      <div className="text-sm text-gray-400">/ 100</div>
                    </div>
                  </div>

                  {/* AI Feedback */}
                  {item.comment && (
                    <div className="rounded-lg bg-[#282828] border border-[#3B3B3B] p-4">
                      <h3 className="mb-2 text-sm font-semibold text-gray-400">
                        AI Feedback
                      </h3>
                      <p className="text-sm text-gray-300">{item.comment}</p>
                    </div>
                  )}

                  {/* Content Block Scores */}
                  {itemData.filter(d => d.validity !== null).length > 0 && (
                    <div className="rounded-lg bg-[#282828] border border-[#3B3B3B]">
                      <div 
                        className="flex items-center justify-between cursor-pointer p-4"
                        onClick={() => setShowBlockScores(!showBlockScores)}
                      >
                        <h3 className="text-sm font-semibold text-gray-400">
                          Content Block Scores
                        </h3>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showBlockScores ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                          </svg>
                        </button>
                      </div>
                      {showBlockScores && (
                        <div className="space-y-2 px-4 pb-4">
                          {itemData
                            .filter(d => d.validity !== null)
                            .map((block, index) => (
                              <div
                                key={block.id}
                                className="flex items-center justify-between rounded bg-[#282828] border border-[#3B3B3B] p-2"
                              >
                                <span className="text-xs text-gray-400">
                                  Block {index + 1} ({block.type || "unknown"})
                                </span>
                                <span
                                  className={`text-sm font-semibold ${
                                    (block.validity ?? 0) >= 60
                                      ? "text-green-500"
                                      : (block.validity ?? 0) >= 55
                                      ? "text-yellow-500"
                                      : "text-red-500"
                                  }`}
                                >
                                  {block.validity?.toFixed(0) ?? "N/A"}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing Admin Comment */}
                  {item.admin_comment && (
                    <div className="rounded-lg bg-[#282828] border border-[#3B3B3B] p-4">
                      <h3 className="mb-2 text-sm font-semibold text-gray-200">
                        Current Admin Comment
                      </h3>
                      <p className="text-sm text-gray-300">{item.admin_comment}</p>
                    </div>
                  )}

                  {/* Admin Comment Input */}
                  <div className="rounded-lg bg-[#282828] border border-[#3B3B3B] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-gray-400">
                      Admin Comment
                    </h3>
                    <textarea
                      value={adminComment}
                      onChange={(e) => {
                        setAdminComment(e.target.value);
                        if (commentError) {
                          setCommentError("");
                        }
                      }}
                      placeholder="Add your comment here..."
                      className={`w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border ${commentError ? 'border-red-500' : 'border-[#3B3B3B]'} focus:outline-none focus:border-[#7B7B7B] min-h-[100px]`}
                    />
                    {commentError && (
                      <p className="text-red-400 text-xs mt-1">{commentError}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setIsPopupOpen(false);
                        onClose();
                      }}
                      disabled={isSubmitting}
                      className="w-full bg-[#333333] hover:bg-[#4B4B4B] text-white border-2 border-[#4B4B4B] py-2 rounded transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus("declined")}
                        disabled={isSubmitting}
                        className="flex-1 bg-[#800000] hover:bg-[#900000] text-white py-2 rounded transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? "Processing..." : "Decline"}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("verified")}
                        disabled={isSubmitting}
                        className="flex-1 bg-[#6D3F33] hover:bg-[#7B4A3A] text-white py-2 rounded transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? "Processing..." : "Verify"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 py-4">
                  No validation data available
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
