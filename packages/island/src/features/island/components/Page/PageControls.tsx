import ExpandIcon from "@/icons/ExpandIcon";
import LoadingIcon from "@/icons/LoadingIcon";
import RightArrowIcon from "@/icons/RightArrowIcon";
import React, { Dispatch, SetStateAction } from "react";
import { TiArrowMinimise } from "react-icons/ti";

interface PageControlsProps {
  onClick?: () => void;
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
  isSaving?: boolean;
  saveError?: string | null;
}

const PageControls = ({
  onClick,
  isExpanded,
  setIsExpanded,
  isSaving,
  saveError,
}: PageControlsProps) => {
  return (
    <div className="sticky top-0 z-50 flex w-full items-center justify-between bg-[#191919]">
      <div className="flex items-start justify-start gap-3 p-3 text-base md:text-xs">
        <button
          className="flex items-center justify-center text-white"
          onClick={() => {
            setIsExpanded(false);
            onClick?.();
          }}
        >
          <RightArrowIcon />
        </button>
        <button
          className="flex items-center justify-center text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <TiArrowMinimise className="text-base" />
          ) : (
            <ExpandIcon />
          )}
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
  );
};

export default PageControls;
