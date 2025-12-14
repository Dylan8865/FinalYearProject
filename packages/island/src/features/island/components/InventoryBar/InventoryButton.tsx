import React from "react";

interface InventoryButtonProps {
  className: string;
  children?: React.ReactNode;
  onClick?: () => void;

}

const InventoryButton = ({
  className,
  children,
  onClick,
}: InventoryButtonProps) => {
  return (
    <button
      className={`${className} flex h-12 w-12 items-center justify-center border-4 border-black`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default InventoryButton;
