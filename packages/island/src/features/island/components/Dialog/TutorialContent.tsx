import React, { useState } from "react";
import BlockIcon from "@/icons/BlockIcon";
import DragIcon from "@/icons/DragIcon";
import TrashIcon from "@/icons/TrashIcon";
import { toCapitalise } from "@/lib/utils/capitalise";
import { useTheme } from "../../contexts/ThemeContext";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
}

interface TutorialContentProps {
  onClose?: () => void;
}

const TutorialContent = ({ onClose }: TutorialContentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

  const steps: Step[] = [
    {
      title: "Place Blocks",
      description:
        "Select an item from your hotbar or inventory, then click any grid cell on an island to place it.",
      icon: (
        <div className="rounded-xl bg-[#dcd1c1] p-3 text-black">
          <BlockIcon />
        </div>
      ),
      action: "Click item → Click grid",
    },
    {
      title: "Move Blocks",
      description:
        "Double-click a placed block to select it, then click another grid cell or on top of a terrain block to move it.",
      icon: (
        <div className="rounded-xl bg-[#dcd1c1] p-3 text-black">
          <DragIcon />
        </div>
      ),
      action: "Double-click → Click target",
    },
    {
      title: "Remove & Manage",
      description:
        "Select a placed block, then click an empty slot in your inventory to remove it. Use the trash icon in the inventory modal to delete items forever.",
      icon: (
        <div className="rounded-xl bg-[#dcd1c1] p-3 text-black">
          <TrashIcon />
        </div>
      ),
      action: "Select block → Click inventory slot",
    },
    {
      title: "Interact & Edit",
      description:
        "Click on functional blocks (like buildings or trees) to open their properties and edit their content.",
      icon: (
        <div className="rounded-xl bg-[#dcd1c1] p-3 text-black">
          <div className="flex h-6 w-6 items-center justify-center font-bold">
            ✎
          </div>
        </div>
      ),
      action: "Click block → Edit content",
    },
  ];

  return (
    <div
      className={`flex h-full flex-col ${isDark ? "text-white" : "text-black"}`}
    >
      <div className="flex flex-1 flex-col items-center justify-center space-y-6 px-4">
        <div className="mb-4 scale-125 transform transition-all duration-500">
          {steps[currentStep].icon}
        </div>

        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold text-[#dcd1c1]">
            {steps[currentStep].title}
          </h2>
          <p
            className={`max-w-sm leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-600"}`}
          >
            {steps[currentStep].description}
          </p>
          <div
            className={`inline-block rounded-full border ${isDark ? "border-white/20 bg-white/5" : "border-black/20 bg-black/5"} px-4 py-2`}
          >
            <span className="font-mono text-sm uppercase tracking-wider text-[#dcd1c1]">
              {steps[currentStep].action}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`flex flex-col items-center space-y-4 border-t ${isDark ? "border-white/10" : "border-black/10"} py-6`}
      >
        <div className="flex space-x-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "bg-[#dcd1c1]"
                  : isDark
                    ? "bg-white/20"
                    : "bg-black/20"
              }`}
            />
          ))}
        </div>

        <div className="flex w-full justify-between px-8">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`rounded-lg border px-4 py-2 transition-all duration-300 ease-in-out ${
              currentStep === 0
                ? "invisible opacity-0"
                : isDark
                  ? "border-gray-400 text-gray-400 hover:border-white hover:text-white"
                  : "border-gray-500 text-gray-500 hover:border-black hover:text-black"
            }`}
          >
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="rounded-lg bg-[#d9d9d9] px-6 py-2 font-bold text-black transition-all hover:bg-[#959595] active:scale-95"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={onClose}
              className="animate-pulse rounded-lg bg-[#dcd1c1] px-6 py-2 font-bold text-black transition-all hover:bg-[#aaa194]"
            >
              Got it!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialContent;
