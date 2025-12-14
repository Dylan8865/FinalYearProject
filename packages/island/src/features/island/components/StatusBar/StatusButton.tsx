import React from "react";

interface StatusButtonProps {
  icon: React.ReactNode;
  data: string | number;
  bgColor: string;
  orientation?: "left" | "right";
  btnIcon?: React.ReactNode;
  onClick?: () => void;
}

const StatusButton = ({
  icon,
  data,
  bgColor,
  orientation,
  btnIcon,
  onClick,
}: StatusButtonProps) => {
  return (
    <div
      className={`${
        orientation == "right" && "scale-x-[-1]"
      } pointer-events-auto relative flex select-none items-center justify-center text-white`}
    >
      <div
        className={`${
          orientation == "right" && "scale-x-[-1]"
        } ${bgColor} flex h-10 w-10 items-center justify-center border-4 border-black text-2xl`}
      >
        {icon}
      </div>
      <div
        className={`${
          orientation == "right"
            ? "scale-x-[-1] justify-end border-l-4"
            : "border-r-4"
        } flex h-8 w-48 items-center border-y-4 border-black bg-[#333333] px-3`}
      >
        {data}
      </div>
      {btnIcon && (
        <button
          className={`${
            orientation == "right" && "scale-x-[-1]"
          } absolute right-0 flex h-8 w-10 items-center justify-center border-4 border-black bg-[#1a1a1a]`}
          onClick={onClick}
        >
          {btnIcon}
        </button>
      )}
    </div>
  );
};

export default StatusButton;
