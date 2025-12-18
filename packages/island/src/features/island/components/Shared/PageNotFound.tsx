"use client";

import IslandIcon from "@/icons/IslandIcon";
import { useRouter } from "next/navigation";
import React from "react";

interface PageNotFoundProps {
  width?: string;
  height?: string;
  bgColor?: string;
}

const PageNotFound = ({
  width = "w-screen",
  height = "h-screen",
  bgColor = "bg-[#1e1e20]",
}: PageNotFoundProps) => {
  const router = useRouter();

  return (
    <div
      className={`flex ${height} ${width} ${bgColor} items-center justify-center`}
    >
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-xl bg-white/5 p-8 text-center shadow-lg backdrop-blur">
        {/* Icon */}
        <IslandIcon className="h-14 w-14 text-white/90" />

        {/* Title */}
        <h1 className="text-lg font-semibold text-white">Island Not Found</h1>

        {/* Description */}
        <p className="text-sm text-gray-400">
          Looks like this island drifted away or never existed.
        </p>

        {/* Action */}
        <button
          onClick={() => router.back()}
          className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#1e1e20] transition hover:bg-gray-200"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default PageNotFound;
