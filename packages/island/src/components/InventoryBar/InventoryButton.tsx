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
      className={`${className} flex justify-center items-center border-black border-4 h-12 w-12`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default InventoryButton;
