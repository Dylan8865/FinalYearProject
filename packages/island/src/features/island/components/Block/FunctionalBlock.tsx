import React from "react";

export interface FunctionalBlockProps {
    itemId: string;
    itemName: string;
    modelUrl?: string;
    onOpen?: (itemId: string, itemName: string) => void;
    onRemove?: (itemId: string) => void;
}

/**
 * FunctionalBlock Component
 * 
 * Represents functional items with special abilities
 * - Single click → Opens dialog/interface
 * - Can be removed
 * - Has custom functionality per item
 * 
 * Examples: Houses, Workbenches, Machines, Storage
 */
const FunctionalBlock = ({ itemId, itemName, modelUrl, onOpen, onRemove }: FunctionalBlockProps) => {
    return (
        <group
            onClick={(e) => {
                e.stopPropagation();
                // Single click opens the functional item
                console.log("Opening functional item:", itemName);
                onOpen?.(itemId, itemName);
            }}
            onContextMenu={(e) => {
                e.stopPropagation();
                // Right-click shows options (open + remove)
                onRemove?.(itemId);
            }}
        >
            {/* Placeholder - replace with actual model loading */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshStandardMaterial color="#8B4513" emissive="#FFA500" emissiveIntensity={0.2} />
            </mesh>

            {/* Optional indicator that this is functional */}
            <mesh position={[0, 0.4, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color="#FFD700" />
            </mesh>
        </group>
    );
};

export default FunctionalBlock;
