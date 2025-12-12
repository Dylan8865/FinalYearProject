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
 * Exactly 20 different functional item types with unique visuals
 * - Saplings: Oak, Spruce, Birch, Jungle (young trees)
 * - Crops: Wheat, Carrot, Potato, Pumpkin
 * - Machines: Furnace, Anvil, Loom, Brewing Stand
 * - Workbenches: Crafting Table, Enchanting Table, Smithing Table, Fletching Table
 * - Storage: Chest, Barrel, Shulker Box, Ender Chest
 * 
 * Each has distinct visual representation using Three.js primitives
 */
const FunctionalBlock = ({ itemId, itemName, modelUrl, onOpen, onRemove }: FunctionalBlockProps) => {
    switch (itemName) {
        // === SAPLINGS (Young Trees) ===
        case "Oak Sapling":
            return (
                <group>
                    {/* Small pot */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
                        <meshStandardMaterial color="#8B4513" roughness={0.8} />
                    </mesh>
                    {/* Stem */}
                    <mesh position={[0, -0.3, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
                        <meshStandardMaterial color="#654321" />
                    </mesh>
                    {/* Leaves */}
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <sphereGeometry args={[0.25, 8, 8]} />
                        <meshStandardMaterial color="#4d7c0f" roughness={0.9} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Spruce Sapling":
            return (
                <group>
                    {/* Small pot */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
                        <meshStandardMaterial color="#8B4513" roughness={0.8} />
                    </mesh>
                    {/* Stem */}
                    <mesh position={[0, -0.25, 0]} castShadow>
                        <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
                        <meshStandardMaterial color="#5d4a37" />
                    </mesh>
                    {/* Conical leaves */}
                    <mesh position={[0, 0.15, 0]} castShadow>
                        <coneGeometry args={[0.25, 0.6, 8]} />
                        <meshStandardMaterial color="#2d5016" roughness={0.9} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.55, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Birch Sapling":
            return (
                <group>
                    {/* Small pot */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
                        <meshStandardMaterial color="#8B4513" roughness={0.8} />
                    </mesh>
                    {/* White stem */}
                    <mesh position={[0, -0.3, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
                        <meshStandardMaterial color="#eee8d5" />
                    </mesh>
                    {/* Light green leaves */}
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <sphereGeometry args={[0.25, 8, 8]} />
                        <meshStandardMaterial color="#84cc16" roughness={0.9} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Jungle Sapling":
            return (
                <group>
                    {/* Small pot */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
                        <meshStandardMaterial color="#8B4513" roughness={0.8} />
                    </mesh>
                    {/* Thick stem */}
                    <mesh position={[0, -0.25, 0]} castShadow>
                        <cylinderGeometry args={[0.06, 0.06, 0.6, 6]} />
                        <meshStandardMaterial color="#3e2723" />
                    </mesh>
                    {/* Large leaves */}
                    <mesh position={[0, 0.15, 0]} castShadow>
                        <sphereGeometry args={[0.3, 8, 8]} />
                        <meshStandardMaterial color="#166534" roughness={0.9} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.55, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        // === CROPS ===
        case "Wheat Crop":
            return (
                <group>
                    {/* Dirt base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.5, 0.2, 0.5]} />
                        <meshStandardMaterial color="#5c4033" roughness={0.9} />
                    </mesh>
                    {/* Wheat stalks */}
                    {[0, 1, 2, 3].map((i) => (
                        <mesh key={i} position={[(i % 2) * 0.15 - 0.075, -0.2, Math.floor(i / 2) * 0.15 - 0.075]} castShadow>
                            <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
                            <meshStandardMaterial color="#d4af37" />
                        </mesh>
                    ))}
                    {/* Wheat heads */}
                    {[0, 1, 2, 3].map((i) => (
                        <mesh key={i} position={[(i % 2) * 0.15 - 0.075, 0.15, Math.floor(i / 2) * 0.15 - 0.075]} castShadow>
                            <boxGeometry args={[0.08, 0.12, 0.08]} />
                            <meshStandardMaterial color="#eab308" />
                        </mesh>
                    ))}
                    {/* Functional indicator */}
                    <mesh position={[0, 0.45, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Carrot Crop":
            return (
                <group>
                    {/* Dirt base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.5, 0.2, 0.5]} />
                        <meshStandardMaterial color="#5c4033" roughness={0.9} />
                    </mesh>
                    {/* Green leaves sticking up */}
                    {[0, 1, 2].map((i) => (
                        <mesh key={i} position={[Math.cos(i * 2.1) * 0.1, -0.4, Math.sin(i * 2.1) * 0.1]} rotation={[0, 0, i * 0.3]} castShadow>
                            <boxGeometry args={[0.12, 0.4, 0.02]} />
                            <meshStandardMaterial color="#15803d" />
                        </mesh>
                    ))}
                    {/* Functional indicator */}
                    <mesh position={[0, 0.2, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Potato Crop":
            return (
                <group>
                    {/* Dirt base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.5, 0.2, 0.5]} />
                        <meshStandardMaterial color="#5c4033" roughness={0.9} />
                    </mesh>
                    {/* Bushy leaves */}
                    <mesh position={[0, -0.35, 0]} castShadow>
                        <sphereGeometry args={[0.2, 8, 6]} />
                        <meshStandardMaterial color="#166534" roughness={0.85} />
                    </mesh>
                    <mesh position={[0.1, -0.3, 0.1]} castShadow>
                        <sphereGeometry args={[0.15, 8, 6]} />
                        <meshStandardMaterial color="#16a34a" roughness={0.85} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.1, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Pumpkin Crop":
            return (
                <group>
                    {/* Dirt base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.5, 0.2, 0.5]} />
                        <meshStandardMaterial color="#5c4033" roughness={0.9} />
                    </mesh>
                    {/* Pumpkin */}
                    <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
                        <sphereGeometry args={[0.25, 12, 8]} />
                        <meshStandardMaterial color="#ea580c" roughness={0.7} />
                    </mesh>
                    {/* Stem */}
                    <mesh position={[0, -0.05, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.08, 0.15, 6]} />
                        <meshStandardMaterial color="#365314" />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.15, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        // === MACHINES ===
        case "Furnace":
            return (
                <group>
                    {/* Main body */}
                    <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.8, 0.6]} />
                        <meshStandardMaterial color="#4a5568" roughness={0.7} metalness={0.3} />
                    </mesh>
                    {/* Opening */}
                    <mesh position={[0, -0.3, 0.31]}>
                        <boxGeometry args={[0.3, 0.3, 0.02]} />
                        <meshStandardMaterial color="#1a1a1a" emissive="#ff6600" emissiveIntensity={0.5} />
                    </mesh>
                    {/* Chimney */}
                    <mesh position={[0, 0.15, 0]} castShadow>
                        <cylinderGeometry args={[0.15, 0.18, 0.3, 8]} />
                        <meshStandardMaterial color="#374151" roughness={0.8} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.45, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Anvil":
            return (
                <group>
                    {/* Base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.5, 0.2, 0.5]} />
                        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.8} />
                    </mesh>
                    {/* Middle section */}
                    <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.3, 0.3, 0.3]} />
                        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.85} />
                    </mesh>
                    {/* Top working surface */}
                    <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.15, 0.4]} />
                        <meshStandardMaterial color="#4b5563" roughness={0.3} metalness={0.9} />
                    </mesh>
                    {/* Horn */}
                    <mesh position={[0.25, -0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <coneGeometry args={[0.08, 0.2, 8]} />
                        <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.85} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.15, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Loom":
            return (
                <group>
                    {/* Base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.15, 0.5]} />
                        <meshStandardMaterial color="#8b4513" roughness={0.9} />
                    </mesh>
                    {/* Vertical posts */}
                    <mesh position={[-0.2, -0.2, 0]} castShadow>
                        <boxGeometry args={[0.08, 0.7, 0.08]} />
                        <meshStandardMaterial color="#654321" roughness={0.85} />
                    </mesh>
                    <mesh position={[0.2, -0.2, 0]} castShadow>
                        <boxGeometry args={[0.08, 0.7, 0.08]} />
                        <meshStandardMaterial color="#654321" roughness={0.85} />
                    </mesh>
                    {/* Top beam */}
                    <mesh position={[0, 0.2, 0]} castShadow>
                        <boxGeometry args={[0.5, 0.08, 0.08]} />
                        <meshStandardMaterial color="#654321" roughness={0.85} />
                    </mesh>
                    {/* Weaving area with threads */}
                    <mesh position={[0, -0.1, 0]}>
                        <planeGeometry args={[0.35, 0.35]} />
                        <meshStandardMaterial color="#f3f4f6" />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.45, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Brewing Stand":
            return (
                <group>
                    {/* Base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.3, 0.35, 0.1, 8]} />
                        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.5} />
                    </mesh>
                    {/* Central rod */}
                    <mesh position={[0, -0.2, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
                        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.7} />
                    </mesh>
                    {/* Top platform */}
                    <mesh position={[0, 0.2, 0]} castShadow>
                        <cylinderGeometry args={[0.2, 0.2, 0.05, 8]} />
                        <meshStandardMaterial color="#4b5563" roughness={0.6} metalness={0.5} />
                    </mesh>
                    {/* Three potion holders */}
                    {[0, 1, 2].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * 2.094) * 0.18, 
                                -0.35, 
                                Math.sin(i * 2.094) * 0.18
                            ]} 
                            castShadow
                        >
                            <cylinderGeometry args={[0.06, 0.04, 0.2, 8]} />
                            <meshStandardMaterial 
                                color={['#8b5cf6', '#10b981', '#ef4444'][i]} 
                                transparent 
                                opacity={0.7} 
                            />
                        </mesh>
                    ))}
                    {/* Functional indicator */}
                    <mesh position={[0, 0.45, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        // === WORKBENCHES ===
        case "Crafting Table":
            return (
                <group>
                    {/* Main table */}
                    <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.7, 0.5, 0.7]} />
                        <meshStandardMaterial color="#8b4513" roughness={0.9} />
                    </mesh>
                    {/* Grid pattern on top */}
                    <mesh position={[0, -0.24, 0]}>
                        <boxGeometry args={[0.72, 0.02, 0.72]} />
                        <meshStandardMaterial color="#654321" roughness={0.85} />
                    </mesh>
                    {/* Grid lines */}
                    <mesh position={[0, -0.22, 0]}>
                        <boxGeometry args={[0.02, 0.03, 0.7]} />
                        <meshStandardMaterial color="#3e2723" />
                    </mesh>
                    <mesh position={[0, -0.22, 0]}>
                        <boxGeometry args={[0.7, 0.03, 0.02]} />
                        <meshStandardMaterial color="#3e2723" />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.05, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Enchanting Table":
            return (
                <group>
                    {/* Base pedestal */}
                    <mesh position={[0, -0.65, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.25, 0.3, 0.3, 8]} />
                        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.4} />
                    </mesh>
                    {/* Main table */}
                    <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.4, 0.6]} />
                        <meshStandardMaterial color="#450a0a" roughness={0.3} metalness={0.1} />
                    </mesh>
                    {/* Book on top */}
                    <mesh position={[0, -0.1, 0]} rotation={[0, 0.3, 0]} castShadow>
                        <boxGeometry args={[0.3, 0.05, 0.4]} />
                        <meshStandardMaterial color="#7c2d12" emissive="#8b5cf6" emissiveIntensity={0.3} />
                    </mesh>
                    {/* Floating crystal */}
                    <mesh position={[0, 0.15, 0]}>
                        <octahedronGeometry args={[0.1, 0]} />
                        <meshStandardMaterial 
                            color="#a855f7" 
                            emissive="#a855f7" 
                            emissiveIntensity={0.5} 
                            transparent 
                            opacity={0.8} 
                        />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.35, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Smithing Table":
            return (
                <group>
                    {/* Main table */}
                    <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.7, 0.5, 0.7]} />
                        <meshStandardMaterial color="#3e2723" roughness={0.85} />
                    </mesh>
                    {/* Metal top */}
                    <mesh position={[0, -0.24, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.72, 0.08, 0.72]} />
                        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.8} />
                    </mesh>
                    {/* Small anvil on top */}
                    <mesh position={[0.15, -0.15, 0.15]} castShadow>
                        <boxGeometry args={[0.2, 0.1, 0.15]} />
                        <meshStandardMaterial color="#1f2937" roughness={0.3} metalness={0.9} />
                    </mesh>
                    {/* Hammer */}
                    <mesh position={[-0.2, -0.15, -0.15]} rotation={[0, 0, 0.5]} castShadow>
                        <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
                        <meshStandardMaterial color="#8b4513" />
                    </mesh>
                    <mesh position={[-0.08, -0.22, -0.15]} rotation={[0, 0, 0.5]} castShadow>
                        <boxGeometry args={[0.08, 0.12, 0.08]} />
                        <meshStandardMaterial color="#4b5563" metalness={0.7} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.05, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Fletching Table":
            return (
                <group>
                    {/* Main table */}
                    <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.7, 0.5, 0.7]} />
                        <meshStandardMaterial color="#8b4513" roughness={0.9} />
                    </mesh>
                    {/* Work surface */}
                    <mesh position={[0, -0.24, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.72, 0.04, 0.72]} />
                        <meshStandardMaterial color="#d4a574" roughness={0.85} />
                    </mesh>
                    {/* Bow on table */}
                    <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0.3]} castShadow>
                        <torusGeometry args={[0.15, 0.02, 8, 12, Math.PI]} />
                        <meshStandardMaterial color="#654321" />
                    </mesh>
                    {/* Arrows */}
                    {[0, 1, 2].map((i) => (
                        <mesh key={i} position={[0.15 + i * 0.08, -0.18, 0.2]} rotation={[0, 0, 1.5]} castShadow>
                            <cylinderGeometry args={[0.01, 0.01, 0.3, 6]} />
                            <meshStandardMaterial color="#8b4513" />
                        </mesh>
                    ))}
                    {/* Functional indicator */}
                    <mesh position={[0, 0.05, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        // === STORAGE ===
        case "Chest":
            return (
                <group>
                    {/* Bottom half */}
                    <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.5, 0.4]} />
                        <meshStandardMaterial color="#8b4513" roughness={0.9} />
                    </mesh>
                    {/* Top lid */}
                    <mesh position={[0, -0.25, -0.05]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.3, 0.4]} />
                        <meshStandardMaterial color="#654321" roughness={0.85} />
                    </mesh>
                    {/* Lock */}
                    <mesh position={[0, -0.3, 0.21]}>
                        <boxGeometry args={[0.08, 0.08, 0.03]} />
                        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.1, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Barrel":
            return (
                <group>
                    {/* Main barrel */}
                    <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.28, 0.25, 0.7, 12]} />
                        <meshStandardMaterial color="#8b4513" roughness={0.9} />
                    </mesh>
                    {/* Metal bands */}
                    {[-0.15, 0.15].map((y, i) => (
                        <mesh key={i} position={[0, -0.4 + y, 0]}>
                            <cylinderGeometry args={[0.29, 0.29, 0.06, 12]} />
                            <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.7} />
                        </mesh>
                    ))}
                    {/* Top lid */}
                    <mesh position={[0, -0.05, 0]}>
                        <cylinderGeometry args={[0.28, 0.28, 0.05, 12]} />
                        <meshStandardMaterial color="#654321" roughness={0.85} />
                    </mesh>
                    {/* Functional indicator */}
                    <mesh position={[0, 0.15, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Shulker Box":
            return (
                <group>
                    {/* Base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.5, 0.3, 0.5]} />
                        <meshStandardMaterial color="#8b5cf6" roughness={0.6} />
                    </mesh>
                    {/* Lid */}
                    <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.5, 0.15, 0.5]} />
                        <meshStandardMaterial color="#a78bfa" roughness={0.6} />
                    </mesh>
                    {/* Shell pattern details */}
                    {[0, 1, 2, 3].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                (i % 2) * 0.25 - 0.125, 
                                -0.45, 
                                Math.floor(i / 2) * 0.25 - 0.125
                            ]}
                        >
                            <boxGeometry args={[0.15, 0.32, 0.15]} />
                            <meshStandardMaterial color="#7c3aed" roughness={0.5} />
                        </mesh>
                    ))}
                    {/* Functional indicator */}
                    <mesh position={[0, -0.1, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        case "Ender Chest":
            return (
                <group>
                    {/* Bottom half */}
                    <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.5, 0.4]} />
                        <meshStandardMaterial 
                            color="#0c0a09" 
                            emissive="#06b6d4" 
                            emissiveIntensity={0.3} 
                            roughness={0.3} 
                        />
                    </mesh>
                    {/* Top lid */}
                    <mesh position={[0, -0.25, -0.05]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.3, 0.4]} />
                        <meshStandardMaterial 
                            color="#0c0a09" 
                            emissive="#06b6d4" 
                            emissiveIntensity={0.4} 
                            roughness={0.3} 
                        />
                    </mesh>
                    {/* Glowing lock */}
                    <mesh position={[0, -0.3, 0.21]}>
                        <boxGeometry args={[0.08, 0.08, 0.03]} />
                        <meshStandardMaterial 
                            color="#06b6d4" 
                            emissive="#06b6d4" 
                            emissiveIntensity={0.8} 
                        />
                    </mesh>
                    {/* Ender particles */}
                    {[0, 1, 2].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * 2.094) * 0.25, 
                                -0.2 + Math.sin(Date.now() * 0.001 + i) * 0.05, 
                                Math.sin(i * 2.094) * 0.25
                            ]}
                        >
                            <sphereGeometry args={[0.04, 8, 8]} />
                            <meshBasicMaterial color="#a855f7" />
                        </mesh>
                    ))}
                    {/* Functional indicator */}
                    <mesh position={[0, 0.1, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );

        default:
            // Fallback for unknown functional blocks
            return (
                <group>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[0.6, 0.6, 0.6]} />
                        <meshStandardMaterial color="#8B4513" emissive="#FFA500" emissiveIntensity={0.2} />
                    </mesh>
                    <mesh position={[0, 0.4, 0]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshBasicMaterial color="#FFD700" />
                    </mesh>
                </group>
            );
    }
};

export default FunctionalBlock;
