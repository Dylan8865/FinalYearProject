import { IslandItemType } from "@/types/types";
import React from "react";
import Image from "next/image";

interface PageHeaderProps {
  islandItem: IslandItemType | null;
}

const PageHeader = ({ islandItem }: PageHeaderProps) => {
  return (
    <div className="w-full space-y-4 border-b text-white">
      {islandItem?.cover_image ? (
        <div className="relative h-[200px] w-full">
          <Image
            src={islandItem?.cover_image}
            alt={islandItem?.title || ""}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-[200px] w-full bg-gray-700"></div>
      )}
      <div className="px-6">
        <h1 className="text-3xl font-bold">
          {islandItem?.title ? islandItem.title : "Untitled"}
        </h1>
      </div>
    </div>
  );
};

export default PageHeader;
