import React from "react";
import CloseIcon from "../icons/CloseIcon";
import UserIcon from "../icons/UserIcon";

interface DialogProps {
  bgColor: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: "small" | "large";
  setIsDialogOpen: (value: string) => void;
}

const Dialog = ({
  bgColor,
  title,
  children,
  className,
  size = "small",
  setIsDialogOpen,
}: DialogProps) => {
  return (
    <div className="relative h-screen w-screen flex justify-center items-center z-90 bg-black bg-opacity-25">
      <div
        className={`${
          size == "small" ? "h-[500px] w-[500px]" : "h-[500px] w-[1000px]"
        } relative border-black border-4`}
      >
        {/* header */}
        <div className="relative z-20 flex justify-between h-10 bg-[#333333]">
          {/* left */}
          <div className="flex">
            <div
              className={`${bgColor} h-14 w-14 border-black border-4 mt-[-10px] ml-[-10px] text-white flex justify-center items-center`}
            >
              <UserIcon />
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
