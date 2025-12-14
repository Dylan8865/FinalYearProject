import { ItemType } from "@/types/types";
import React, { useState } from "react";

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
  return (
    <button
      className={`${className} flex h-12 w-12 select-none items-center justify-center border-4 border-black`}
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
