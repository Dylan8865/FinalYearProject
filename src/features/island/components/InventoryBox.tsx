import React from "react";

interface InventoryBoxProps {
  bgColor: string;
  content?: React.ReactNode;
}

const InventoryBox = ({ bgColor, content }: InventoryBoxProps) => {
  return (
    <div
      className={`${bgColor} flex justify-center items-center border-black border-4 h-12 w-12`}
    >
      {content}
    </div>
  );
};

export default InventoryBox;
