import React, { useState } from "react";
import { Suspense } from "react";
import TerrainBlock from "../Block/TerrainBlocks";
import DecorativeBlock from "../Block/DecorativeBlock";
import FunctionalBlock from "../Block/FunctionalBlock";

interface PlacedBlockProps {
    itemId: string;
    itemName: string;
    itemType: "terrain" | "decorative" | "functional";
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
 * - Single click: Select the block
 * - Double click (functional only): Open sidebar
 * 
 * @param itemId - Unique ID of the placed item
 * @param itemName - Display name
 * @param itemType - Type: terrain, decorative, or functional
 * @param modelUrl - URL to 3D model
 * @param allowStacking - Whether this block type allows stacking other blocks on top
 * @param isSelected - Whether this block is currently selected
 * @param onClick - Callback for single click
 * @param onDoubleClick - Callback for double click (functional items only)
 */
const PlacedBlock = ({
    itemId,
    itemName,
    itemType,
    modelUrl,
    allowStacking = true,
    isSelected = false,
    onClick,
    onDoubleClick,
}: PlacedBlockProps) => {
    const [clickCount, setClickCount] = useState(0);
    const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

    const handleClick = (e: any) => {
        e.stopPropagation();

        // Increment click count
        const newClickCount = clickCount + 1;
        setClickCount(newClickCount);

        // Clear existing timer
        if (clickTimer) {
            clearTimeout(clickTimer);
        }

        // Set timer to reset click count
        const timer = setTimeout(() => {
            setClickCount(0);
        }, 300);
        setClickTimer(timer);

        // Check for double-click (only for functional items)
        if (newClickCount === 2 && itemType === "functional") {
            console.log("Double-click detected on functional item:", itemName);
            setClickCount(0);
            if (clickTimer) clearTimeout(clickTimer);
            onDoubleClick?.(itemId, itemType, itemName);
        } else if (newClickCount === 1) {
            // Wait a bit to see if it's a double-click
            setTimeout(() => {
                // Check if still only 1 click after delay
                if (clickCount === 0 || clickCount === 1) {
                    // Single click
                    onClick?.(itemId, itemType, itemName);
                }
            }, 300);
        }
    };

    // Render based on item type
    let content: React.ReactNode;

    switch (itemType) {
        case "terrain":
            // Terrain blocks allow stacking and use the TerrainBlock component
            content = (
                <Suspense fallback={<TerrainBlock name="Grass" />}>
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
        <group onClick={handleClick}>
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
            {content}
        </group>
    );
};

export default PlacedBlock;
