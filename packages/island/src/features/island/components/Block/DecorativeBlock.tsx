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
 * Represents decorative items placed on the island
 * - Cannot be stacked upon (only terrain supports stacking)
 * - Click interactions handled by PlacedBlock wrapper
 * - Single-click: Opens dialog
 * - Double-click: Selects for moving
 * 
 * Examples: Trees, Rocks, Flowers, Decorations
 */
const DecorativeBlock = ({ itemId, itemName, modelUrl, onRemove }: DecorativeBlockProps) => {
    return (
        <group>
            {/* Placeholder - replace with actual model loading */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.8, 0.5]} />
                <meshStandardMaterial color="#4A7C59" />
            </mesh>
        </group>
    );
};

export default DecorativeBlock;
