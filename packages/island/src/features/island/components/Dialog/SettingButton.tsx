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
    <div className="flex w-80 justify-between md:w-auto md:gap-4">
      <div className={`${!fieldName && "opacity-0"} flex items-center`}>
        {fieldName}
      </div>
      <button className="flex h-8 w-60 md:h-10 md:w-80" onClick={onClick}>
        <div
          className={`${
            color == "gray"
              ? "bg-[#6c6d6a] text-black"
              : "bg-[#4c0000] text-white"
          } flex h-8 w-9 items-center justify-center text-base md:h-10 md:w-11 md:text-2xl`}
        >
          {icon}
        </div>
        <div
          className={`${
            color == "gray"
              ? "bg-[#d9d9d9] text-black"
              : "bg-[#800000] text-white"
          } flex h-full w-full items-center justify-center border-s-4 border-black font-semibold`}
        >
          {title}
        </div>
      </button>
    </div>
  );
};

export default SettingButton;
