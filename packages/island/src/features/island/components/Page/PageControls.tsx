import ExpandIcon from "@/icons/ExpandIcon";
import LoadingIcon from "@/icons/LoadingIcon";
import RightArrowIcon from "@/icons/RightArrowIcon";
import React from "react";

interface PageControlsProps {
  onClick?: () => void;
  onExpand?: () => void;
  isSaving?: boolean;
  saveError?: string | null;
}

const PageControls = ({
  onClick,
  onExpand,
  isSaving,
  saveError,
}: PageControlsProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start justify-start gap-3 p-3 text-base md:text-xs">
        <button
          className="flex items-center justify-center text-white"
          onClick={onClick}
        >
          <RightArrowIcon />
        </button>
        <button
          className="flex items-center justify-center text-white"
          onClick={onExpand}
        >
          <ExpandIcon />
        </button>
      </div>
      <div className="flex items-center justify-center overflow-hidden pr-2 text-white/50">
        {isSaving && (
          <div className="flex items-center justify-center gap-2">
            <LoadingIcon className="!h-3 !w-3" />
            <p className="text-[10px]">Saving...</p>
          </div>
        )}
        {!saveError && <p className="text-red-500">{saveError}</p>}
      </div>
    </div>
  );
};

export default PageControls;
