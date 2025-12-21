import React, { useState } from "react";
import CloseIcon from "@/icons/CloseIcon";
import SlotTooltip from "./SlotTooltip";

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
  const [showMenuTooltip, setShowMenuTooltip] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <>
      <div className="relative z-20 flex h-[100dvh] w-[100dvw] items-center justify-center bg-black bg-opacity-25">
        <div
          className={`${
            size == "medium"
              ? "h-[500px] w-[400px] md:h-[500px] md:w-[500px]" // medium
              : size == "large"
                ? "h-[500px] w-[400px] md:h-[500px] md:w-[1000px]" // large
                : "h-[300px] w-[300px]" // small
          } relative ${borderColor} select-none border-4`}
        >
          {/* header */}
          <div className="relative z-20 flex h-8 justify-between bg-[#333333] md:h-10">
            {/* left */}
            <div className="flex">
              <div
                className={`${iconStyle} h-12 w-12 md:h-14 md:w-14 ${borderColor} ml-[-10px] mt-[-10px] flex items-center justify-center border-4`}
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
              className="flex h-8 w-8 items-center justify-center bg-[#1a1a1a] pb-0.5 ps-0.5 text-white md:h-10 md:w-10"
              onMouseEnter={() => setShowMenuTooltip(true)}
              onMouseLeave={() => setShowMenuTooltip(false)}
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            >
              <CloseIcon />
            </button>
          </div>

          {/* body */}
          <div
            className={`${className} relative h-[calc(100%-2rem)] overflow-hidden bg-black p-4 text-white md:h-[calc(100%-2.5rem)]`}
          >
            {children}
          </div>
        </div>
      </div>
      {showMenuTooltip && (
        <SlotTooltip
          title={"Esc"}
          description={["Close"]}
          x={mousePos.x}
          y={mousePos.y}
        />
      )}
    </>
  );
};

export default Dialog;
