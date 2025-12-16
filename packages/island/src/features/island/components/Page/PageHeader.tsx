import { IslandItemType } from "@/types/types";
import React from "react";
import {
  PageTitle,
  PageText,
  PageBulletList,
  PageBulletPoint,
} from "./PageComponents";
import Image from "next/image";

interface PageHeaderProps {
  islandItem: IslandItemType | null;
}

const PageHeader = ({ islandItem }: PageHeaderProps) => {
  return (
    <div className="absolute top-10 w-full space-y-4 px-6 text-white">
      <div className="relative h-[200px] w-full">
        <Image
          src={islandItem?.cover_image || ""}
          alt={islandItem?.title || ""}
          fill
          className="object-cover"
        />
      </div>
      <PageTitle>{islandItem?.title ? islandItem.title : "Untitled"}</PageTitle>
    </div>
  );
};

export default PageHeader;
