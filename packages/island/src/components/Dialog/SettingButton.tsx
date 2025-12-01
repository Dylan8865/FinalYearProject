import React from "react";

interface SettingButtonProps {
  fieldName?: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  onClick?: () => void;
}

const SettingButton = ({
  fieldName,
  icon,
  title,
  color,
  onClick,
}: SettingButtonProps) => {
  return (
    <div className="flex gap-4 justify-between">
      <div className={`${!fieldName && "opacity-0"} flex items-center`}>
        {fieldName}
      </div>
      <button className="flex w-80 h-10">
        <div
          className={`${
            color == "gray"
              ? "bg-[#6c6d6a] text-black"
              : "bg-[#4c0000] text-white"
          } flex justify-center items-center w-11 h-10 text-2xl`}
        >
          {icon}
        </div>
        <div
          className={`${
            color == "gray"
              ? "bg-[#d9d9d9] text-black"
              : "bg-[#800000] text-white"
          } border-s-4 border-black flex justify-center items-center w-full font-semibold`}
        >
          {title}
        </div>
      </button>
    </div>
  );
};

export default SettingButton;
