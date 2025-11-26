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
      } relative flex justify-center items-center text-white`}
    >
      <div
        className={`${
          orientation == "right" && "scale-x-[-1]"
        } ${bgColor} border-4 text-2xl border-black flex justify-center items-center w-10 h-10`}
      >
        {icon}
      </div>
      <div
        className={`${
          orientation == "right"
            ? "scale-x-[-1] justify-end border-l-4"
            : "border-r-4"
        } border-y-4 border-black bg-[#333333] w-48 h-8 px-3 flex items-center`}
      >
        {data}
      </div>
      {btnIcon && (
        <button
          className={`${
            orientation == "right" && "scale-x-[-1]"
          } absolute right-0 border-black border-4 w-10 h-8 flex items-center justify-center bg-[#1a1a1a]`}
          onClick={onClick}
        >
          {btnIcon}
        </button>
      )}
    </div>
  );
};

export default StatusButton;
