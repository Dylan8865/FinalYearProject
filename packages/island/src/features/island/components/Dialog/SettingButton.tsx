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
    <div className="flex justify-between gap-4">
      <div className={`${!fieldName && "opacity-0"} flex items-center`}>
        {fieldName}
      </div>
      <button className="flex h-10 w-80" onClick={onClick}>
        <div
          className={`${
            color == "gray"
              ? "bg-[#6c6d6a] text-black"
              : "bg-[#4c0000] text-white"
          } flex h-10 w-11 items-center justify-center text-2xl`}
        >
          {icon}
        </div>
        <div
          className={`${
            color == "gray"
              ? "bg-[#d9d9d9] text-black"
              : "bg-[#800000] text-white"
          } flex w-full items-center justify-center border-s-4 border-black font-semibold`}
        >
          {title}
        </div>
      </button>
    </div>
  );
};

export default SettingButton;
