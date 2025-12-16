import React from "react";
import PageHeader from "./PageHeader";
import { IslandItemType } from "@/types/types";

const PageBody = ({ islandItem }: { islandItem: IslandItemType | null }) => {
  return (
    <div className="w-full">
      <PageHeader islandItem={islandItem} />
    </div>
  );
};

export default PageBody;
