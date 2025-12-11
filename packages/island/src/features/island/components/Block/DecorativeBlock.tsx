import React from "react";

export interface DecorativeBlockProps {
    itemId: string;
    itemName: string;
    modelUrl?: string;
    onRemove?: (itemId: string) => void;
}

/**
 * DecorativeBlock Component
 * 
 * Represents decorative items
 * - Cannot be stacked upon
 * - Only provides "Remove" action
 * - No special click behavior
 * 
 * Examples: Trees, Rocks, Flowers, Decorations
 */
const DecorativeBlock = ({ itemId, itemName, modelUrl, onRemove }: DecorativeBlockProps) => {
    return (
        <group
            onClick={(e) => {
                e.stopPropagation();
                // Decorative items don't have click actions
                console.log("Decorative item clicked:", itemName);
            }}
            onContextMenu={(e) => {
                e.stopPropagation();
                // Right-click shows remove option
                onRemove?.(itemId);
            }}
        >
            {/* Placeholder - replace with actual model loading */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.8, 0.5]} />
                <meshStandardMaterial color="#4A7C59" />
            </mesh>
        </group>
    );
};

export default DecorativeBlock;
