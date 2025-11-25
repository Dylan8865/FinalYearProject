import React from "react";

interface StatusButtonProps {
  icon: React.ReactNode;
  data: string | number;
  bgColor: string;
  orientation?: "left" | "right";
}

const StatusButton = ({
  icon,
  data,
  bgColor,
  orientation,
}: StatusButtonProps) => {
  return (
    <div
      className={`${
        orientation == "right" && "scale-x-[-1]"
      } flex justify-center items-center text-white`}
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
        } border-y-4 border-black bg-[#333333] w-36 h-8 px-3 flex items-center`}
      >
        {data}
      </div>
    </div>
  );
};

export default StatusButton;
