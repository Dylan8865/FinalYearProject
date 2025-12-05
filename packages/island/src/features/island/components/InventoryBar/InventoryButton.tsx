import React from "react";

interface InventoryButtonProps {
  className: string;
  children?: React.ReactNode;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const InventoryButton = ({
  className,
  children,
  onClick,
  draggable = false,
  onDragStart,
  onDragEnd,
}: InventoryButtonProps) => {
  return (
    <button
      className={`${className} flex h-12 w-12 items-center justify-center border-4 border-black ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
    </button>
  );
};

export default InventoryButton;
