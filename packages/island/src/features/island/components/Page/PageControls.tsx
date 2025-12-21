import ExpandIcon from "@/icons/ExpandIcon";
import LoadingIcon from "@/icons/LoadingIcon";
import RightArrowIcon from "@/icons/RightArrowIcon";
import React, { Dispatch, SetStateAction, useState } from "react";
import { TiArrowMinimise } from "react-icons/ti";
import SlotTooltip from "../Dialog/SlotTooltip";

interface PageControlsProps {
  onArrowClick?: () => void;
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
  isSaving?: boolean;
  saveError?: string | null;
  status?: "unverified" | "pending" | "declined" | "verified";
  onStatusClick?: () => void;
}

const PageControls = ({
  onArrowClick: onClick,
  isExpanded,
  setIsExpanded,
  isSaving,
  saveError,
  status = "unverified",
  onStatusClick,
}: PageControlsProps) => {
  // Status color mapping
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

  const config = statusConfig[status] || statusConfig.unverified;

  const [showMenuTooltip, setShowMenuTooltip] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <>
      <div className="sticky top-0 z-50 flex w-full items-center justify-between bg-[#191919]">
        <div className="flex items-center justify-start gap-3 p-3 text-base md:text-xs">
          <button
            className="flex items-center justify-center text-white"
            onClick={() => {
              setIsExpanded(false);
              onClick?.();
            }}
            onMouseEnter={() => setShowMenuTooltip(isExpanded ? null : "Esc")}
            onMouseLeave={() => setShowMenuTooltip(null)}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          >
            <RightArrowIcon />
          </button>
          <button
            className="flex items-center justify-center text-white"
            onClick={() => setIsExpanded(!isExpanded)}
            onMouseEnter={() =>
              setShowMenuTooltip(isExpanded ? "Esc" : "Ctrl + Enter")
            }
            onMouseLeave={() => setShowMenuTooltip(null)}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          >
            {isExpanded ? (
              <TiArrowMinimise className="text-base" />
            ) : (
              <ExpandIcon />
            )}
          </button>
          <button
            className="flex h-[16px] items-center gap-1.5 rounded bg-gray-800 px-2 text-[10px] leading-none hover:bg-gray-700"
            onClick={onStatusClick}
            title="View validation details"
          >
            <div className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
            <span className={config.textColor}>{config.text}</span>
          </button>
        </div>
        <div className="flex items-center justify-center overflow-hidden pr-2 text-white/50">
          {isSaving && (
            <div className="flex items-center justify-center gap-2">
              <LoadingIcon className="!h-3 !w-3" />
              <p className="text-[10px]">Saving...</p>
            </div>
          )}
          {saveError && <p className="text-red-500">{saveError}</p>}
        </div>
      </div>
      {showMenuTooltip && (
        <SlotTooltip
          title={showMenuTooltip}
          description={["Shortcut Key"]}
          x={mousePos.x}
          y={mousePos.y}
        />
      )}
    </>
  );
};

export default PageControls;
