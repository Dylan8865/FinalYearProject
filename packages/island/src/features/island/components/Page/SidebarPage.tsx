import PageControls from "./PageControls";
import { useEffect, useMemo } from "react";
import { useIslandItemsContext } from "../../contexts/IslandItemsContext";
import PageBody from "./PageBody";

interface SidebarPageProps {
  isOpen?: boolean;
  itemId?: string;
  itemName?: string;
  onClick?: () => void;
}

const onExpand = () => {
  console.log("handle onExpand"); // TODO: implement onExpand
};

const SidebarPage = ({
  isOpen,
  itemId,
  itemName,
  onClick,
}: SidebarPageProps) => {
  const { islandItems } = useIslandItemsContext();

  const islandItem = useMemo(() => {
    if (!itemId || itemId.length === 0) return null;
    return islandItems.find((item) => item.id === itemId) ?? null;
  }, [islandItems, itemId]);

  useEffect(() => {
    if (islandItem) {
      console.log(islandItem);
    }
  }, [islandItem]);

  return (
    <div
      className="absolute right-0 top-0 z-50 h-full w-4/5 bg-[#191919] transition-transform duration-300 md:w-[34dvw]"
      style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
    >
      <PageControls onClick={onClick} onExpand={onExpand} />
      <PageBody islandItem={islandItem} />
    </div>
  );
};

export default SidebarPage;
