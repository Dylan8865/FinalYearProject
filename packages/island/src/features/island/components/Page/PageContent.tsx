import React from "react";
import PageHeader from "./PageHeader";
import {
  IslandItemType,
  ItemDataType,
  BlockType,
  BlockProperties,
} from "@/types/types";
import PageBody from "./PageBody";

interface PageContentProps {
  islandItem: IslandItemType | null;
  itemData: ItemDataType[] | null;
  onUpdateBlock?: (
    id: string,
    content: any,
    properties?: BlockProperties
  ) => void;
  onDeleteBlock?: (id: string) => void;
  onAddBlock?: (afterId: string, type: BlockType) => void;
}

const PageContent = ({
  islandItem,
  itemData,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
}: PageContentProps) => {
  return (
    <div className="w-full border">
      <PageHeader islandItem={islandItem} />
      <PageBody
        itemData={itemData}
        onUpdateBlock={onUpdateBlock}
        onDeleteBlock={onDeleteBlock}
        onAddBlock={onAddBlock}
      />
    </div>
  );
};

export default PageContent;
