import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface StatusButtonProps {
  icon: React.ReactNode;
  data: string | number;
  bgColor: string;
  orientation?: "left" | "right";
  btnIcon?: React.ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseMove?: (e: React.MouseEvent) => void;
}

const StatusButton = ({
  icon,
  data,
  bgColor,
  orientation,
  btnIcon,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
}: StatusButtonProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

  return (
    <div
      className={`${
        orientation == "right" && "md:scale-x-[-1]"
      } pointer-events-auto relative flex select-none items-center justify-center ${isDark ? "text-white" : "text-black"}`}
    >
      <div
        className={`${
          orientation == "right" && "md:scale-x-[-1]"
        } ${bgColor} flex h-8 w-8 items-center justify-center border-4 border-black text-2xl md:h-10 md:w-10`}
      >
        {icon}
      </div>
      <div
        className={`${
          orientation == "right"
            ? "border-r-4 md:scale-x-[-1] md:justify-end md:border-l-4 md:border-r-0"
            : "border-r-4"
        } flex h-6 w-40 items-center border-y-4 border-black ${isDark ? "bg-[#333333]" : "bg-[#f5f5f5]"} px-3 text-xs md:h-8 md:text-base lg:w-48`}
      >
        <span className="w-28 truncate md:w-32">{data}</span>
      </div>
      {btnIcon && (
        <button
          className={`${
            orientation == "right" && "md:scale-x-[-1]"
          } absolute right-0 flex h-6 w-8 items-center justify-center border-4 border-black ${isDark ? "bg-[#1a1a1a]" : "bg-[#e0e0e0]"} md:h-8 md:w-10`}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseMove={onMouseMove}
        >
          {btnIcon}
        </button>
      )}
    </div>
  );
};

export default StatusButton;
