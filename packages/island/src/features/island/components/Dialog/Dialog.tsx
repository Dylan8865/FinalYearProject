import React from "react";
import CloseIcon from "@/features/shared/icons/CloseIcon";

interface DialogProps {
  iconStyle: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: "small" | "medium" | "large";
  borderColor?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setIsDialogOpen: React.Dispatch<React.SetStateAction<any>>;
}

const Dialog = ({
  iconStyle,
  icon,
  title,
  children,
  className,
  size = "medium",
  borderColor = "border-black",
  setIsDialogOpen,
}: DialogProps) => {
  return (
    <div className="relative h-screen w-screen flex justify-center items-center z-90 bg-black bg-opacity-25">
      <div
        className={`${
          size == "medium"
            ? "h-[500px] w-[500px]" // medium
            : size == "large"
            ? "h-[500px] w-[1000px]" // large
            : "h-[300px] w-[300px]" // small
        } relative ${borderColor} border-4`}
      >
        {/* header */}
        <div className="relative z-20 flex justify-between h-10 bg-[#333333]">
          {/* left */}
          <div className="flex">
            <div
              className={`${iconStyle} h-14 w-14  ${borderColor} border-4 mt-[-10px] ml-[-10px] flex justify-center items-center`}
            >
              {icon}
            </div>
            <div className="ps-4 flex items-center text-lg text-white">
              {title}
            </div>
          </div>
          {/* right */}
          <button
            onClick={() => setIsDialogOpen("")}
            className="bg-[#1a1a1a] h-10 w-10 ps-0.5 pb-0.5 flex justify-center items-center text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* body */}
        <div
          className={`${className} relative bg-black text-white p-4 h-[calc(100%-2.5rem)]`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
