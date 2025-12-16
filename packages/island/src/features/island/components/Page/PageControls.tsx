import ExpandIcon from "@/icons/ExpandIcon";
import RightArrowIcon from "@/icons/RightArrowIcon";
import React from "react";

interface PageControlsProps {
  onClick?: () => void;
  onExpand?: () => void;
}

const PageControls = ({ onClick, onExpand }: PageControlsProps) => {
  return (
    <div className="flex h-full items-start justify-start gap-3 p-3 text-base md:text-xs">
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
  );
};

export default PageControls;
