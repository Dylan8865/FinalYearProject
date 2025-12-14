import React from "react";
import CloseIcon from "@/icons/CloseIcon";

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
    <div className="z-90 relative flex h-screen w-screen items-center justify-center bg-black bg-opacity-25">
      <div
        className={`${
          size == "medium"
            ? "h-[500px] w-[500px]" // medium
            : size == "large"
              ? "h-[500px] w-[1000px]" // large
              : "h-[300px] w-[300px]" // small
        } relative ${borderColor} select-none border-4`}
      >
        {/* header */}
        <div className="relative z-20 flex h-10 justify-between bg-[#333333]">
          {/* left */}
          <div className="flex">
            <div
              className={`${iconStyle} h-14 w-14 ${borderColor} ml-[-10px] mt-[-10px] flex items-center justify-center border-4`}
            >
              {icon}
            </div>
            <div className="flex items-center ps-4 text-lg text-white">
              {title}
            </div>
          </div>
          {/* right */}
          <button
            onClick={() => setIsDialogOpen("")}
            className="flex h-10 w-10 items-center justify-center bg-[#1a1a1a] pb-0.5 ps-0.5 text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* body */}
        <div
          className={`${className} relative h-[calc(100%-2.5rem)] bg-black p-4 text-white`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
