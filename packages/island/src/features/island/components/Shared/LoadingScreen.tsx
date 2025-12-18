import IslandIcon from "@/icons/IslandIcon";
import React from "react";

interface LoadingScreenProps {
  width?: string;
  height?: string;
  bgColor?: string;
}

const LoadingScreen = ({
  width = "w-screen",
  height = "h-screen",
  bgColor = "bg-[#1e1e20]",
}: LoadingScreenProps) => {
  return (
    <div
      className={`flex ${height} ${width} ${bgColor} items-center justify-center`}
    >
      <div className="flex flex-col items-center space-y-4">
        <IslandIcon className="h-12 w-12 animate-pulse text-white" />
        <p className="text-sm text-white">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
