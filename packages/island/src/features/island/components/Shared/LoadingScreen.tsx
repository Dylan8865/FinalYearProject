import IslandIcon from "@/icons/IslandIcon";
import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface LoadingScreenProps {
  width?: string;
  height?: string;
  bgColor?: string;
  content?: string;
}

const LoadingScreen = ({
  width = "w-screen",
  height = "h-screen",
  bgColor,
  content = "Loading...",
}: LoadingScreenProps) => {
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

  const finalBgColor = bgColor || (isDark ? "bg-[#1e1e20]" : "bg-[#f5f5f7]");

  return (
    <div
      className={`flex ${height} ${width} ${finalBgColor} select-none items-center justify-center`}
    >
      <div className="flex flex-col items-center space-y-4">
        <IslandIcon
          className={`h-12 w-12 animate-pulse ${isDark ? "text-white" : "text-black"}`}
        />
        <p className={`text-sm ${isDark ? "text-white" : "text-gray-800"}`}>
          {content}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
