import React from "react";

export interface TerrainBlockProps {
    itemId?: string;
    itemName?: string;
    onInteract?: (itemId: string) => void;
}

/**
 * TerrainBlock Component
 * 
 * Represents terrain items that can be stacked
 * - Can have up to 3 items placed on top
 * - Only provides "Remove" action
 * - No special click behavior
 * 
 * Examples: Grass, Stone, Sand, Dirt
 */
const TerrainBlockWrapper = ({ itemId, itemName, onInteract }: TerrainBlockProps) => {
    return (
        <group
            onClick={(e) => {
                e.stopPropagation();
                if (itemId && onInteract) {
                    onInteract(itemId);
                }
            }}
        >
            {/* Your existing TerrainBlock component */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#8B7355" />
            </mesh>
        </group>
    );
};

export default TerrainBlockWrapper;
