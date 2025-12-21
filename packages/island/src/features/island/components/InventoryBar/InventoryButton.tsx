import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface InventoryButtonProps {
  className: string;
  children?: React.ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseMove?: (e: React.MouseEvent) => void;
}

const InventoryButton = ({
  className,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
}: InventoryButtonProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

  return (
    <button
      className={`${className} flex h-14 w-14 select-none items-center justify-center border-4 ${isDark ? "border-black" : "border-gray-400"} md:h-12 md:w-12`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      {children}
    </button>
  );
};

export default InventoryButton;
