import React, { useState, useRef } from "react";
import { Suspense } from "react";
import TerrainBlock from "../Block/TerrainBlocks";
import DecorativeBlock from "../Block/DecorativeBlock";
import FunctionalBlock from "../Block/FunctionalBlock";
import ItemTooltip from "./ItemTooltip";
import { toCapitalise } from "@/lib/capitalise";

interface PlacedBlockProps {
  itemId: string;
  itemName: string;
  itemType: "terrain" | "decorative" | "functional";
  itemManaRate: number;
  modelUrl?: string;
  allowStacking?: boolean;
  isSelected?: boolean;
  onClick?: (itemId: string, itemType: string, itemName: string) => void;
  onDoubleClick?: (itemId: string, itemType: string, itemName: string) => void;
}

/**
 * PlacedBlock - Wrapper for all placed block types
 *
 * Interaction Model:
 * - Hover: Shows tooltip with item name
 * - Single click: Open dialog (currently removal, extendable)
 * - Double click: Select for moving (gold wireframe)
 *
 * @param itemId - Unique ID of the placed item
 * @param itemName - Display name
 * @param itemType - Type: terrain, decorative, or functional
 * @param itemManaRate - Mana rate of the item
 * @param modelUrl - URL to 3D model
 * @param allowStacking - Whether this block type allows stacking other blocks on top
 * @param isSelected - Whether this block is currently selected
 * @param onClick - Callback for single click
 * @param onDoubleClick - Callback for double click
 */
const PlacedBlock = ({
  itemId,
  itemName,
  itemType,
  itemManaRate,
  modelUrl,
  isSelected = false,
  onClick,
  onDoubleClick,
}: PlacedBlockProps) => {
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleClickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();
    setIsHovered(true);
  };

  const handlePointerLeave = (e: any) => {
    e.stopPropagation();
    setIsHovered(false);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();

    // Increment click count
    clickCountRef.current += 1;
    const currentCount = clickCountRef.current;

    console.log(`Click #${currentCount} on ${itemName} (${itemType})`);

    // Clear existing timers
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    if (singleClickTimerRef.current) {
      clearTimeout(singleClickTimerRef.current);
    }

    // Set timer to reset click count
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 400);

    // Check for double-click
    if (currentCount === 2) {
      console.log("Double-click detected on:", itemName, itemType);
      clickCountRef.current = 0;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (singleClickTimerRef.current)
        clearTimeout(singleClickTimerRef.current);
      onDoubleClick?.(itemId, itemType, itemName);
    } else if (currentCount === 1) {
      // Wait to see if it's a double-click
      singleClickTimerRef.current = setTimeout(() => {
        // Check current value (not closure)
        if (clickCountRef.current === 1) {
          // Still only 1 click after delay - it's a single click
          console.log("Single click confirmed on:", itemName);
          onClick?.(itemId, itemType, itemName);
          clickCountRef.current = 0;
        }
      }, 250); // Reduced from 400ms for faster response
    }
  };

  // Render based on item type
  let content: React.ReactNode;
  const description = [
    `Type: ${toCapitalise(itemType)}`,
    `Mana Rate: ${itemManaRate}/s`,
  ];

  switch (itemType) {
    case "terrain":
      // Terrain blocks allow stacking and use the TerrainBlock component
      content = (
        <Suspense fallback={<TerrainBlock name={itemName} />}>
          <TerrainBlock name={itemName} />
        </Suspense>
      );
      break;

    case "decorative":
      // Decorative blocks use DecorativeBlock component
      content = (
        <DecorativeBlock
          itemId={itemId}
          itemName={itemName}
          modelUrl={modelUrl}
        />
      );
      break;

    case "functional":
      // Functional blocks use FunctionalBlock component
      content = (
        <FunctionalBlock
          itemId={itemId}
          itemName={itemName}
          modelUrl={modelUrl}
          onOpen={(id, name) => {
            console.log("Opening functional item:", name);
            onDoubleClick?.(id, itemType, name);
          }}
        />
      );
      break;

    default:
      // Fallback to terrain block
      content = <TerrainBlock name={itemName || "Grass"} />;
  }

  return (
    <group>
      {/* Invisible bounding box to capture hover events */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <boxGeometry args={[1.4, 1.8, 1.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.3, 1.7, 1.3]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}

      {/* Actual block content */}
      {content}

      {/* Tooltip rendered in 3D space */}
      {isHovered && (
        <>
          <ItemTooltip title={itemName} description={description} />
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.3, 1.7, 1.3]} />
            <meshBasicMaterial
              color="white"
              transparent
              opacity={0.3}
              wireframe
            />
          </mesh>
        </>
      )}
    </group>
  );
};

export default PlacedBlock;
