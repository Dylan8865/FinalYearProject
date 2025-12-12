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
 * Exactly 20 different decorative item types with unique visuals
 * - Flowers: Sunflower, Rose, Tulip, Daisy, Poppy
 * - Mushrooms: Red Mushroom, Brown Mushroom, Glowing Mushroom
 * - Trees: Oak Tree, Pine Tree, Palm Tree, Cherry Blossom
 * - Rocks & Natural: Boulder, Crystal Cluster, Cactus, Bamboo
 * - Special: Lantern, Fountain, Statue, Garden Gnome
 * 
 * Cannot be stacked upon - purely decorative
 */
const DecorativeBlock = ({ itemId, itemName, modelUrl, onRemove }: DecorativeBlockProps) => {
    const position = [0, 0.6, 0] as [number, number, number];

    const renderBlock = () => {
        switch (itemName) {
        // === FLOWERS ===
        case "Sunflower":
            return (
                <group position={position}>
                    {/* Stem */}
                    <mesh position={[0, -0.2, 0]} castShadow>
                        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
                        <meshStandardMaterial color="#4d7c0f" />
                    </mesh>
                    {/* Leaves */}
                    {[-0.2, 0].map((y, i) => (
                        <mesh key={i} position={[0.15, y, 0]} rotation={[0, 0, Math.PI / 3]} castShadow>
                            <boxGeometry args={[0.25, 0.12, 0.02]} />
                            <meshStandardMaterial color="#65a30d" />
                        </mesh>
                    ))}
                    {/* Flower center */}
                    <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
                        <meshStandardMaterial color="#713f12" />
                    </mesh>
                    {/* Petals */}
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * Math.PI / 4) * 0.18, 
                                0.3, 
                                Math.sin(i * Math.PI / 4) * 0.18
                            ]} 
                            rotation={[0, i * Math.PI / 4, Math.PI / 2]}
                            castShadow
                        >
                            <boxGeometry args={[0.15, 0.25, 0.02]} />
                            <meshStandardMaterial color="#fbbf24" />
                        </mesh>
                    ))}
                </group>
            );

        case "Rose":
            return (
                <group position={position}>
                    {/* Stem with thorns */}
                    <mesh position={[0, -0.2, 0]} castShadow>
                        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
                        <meshStandardMaterial color="#15803d" />
                    </mesh>
                    {/* Thorns */}
                    {[-0.1, 0.1, 0.3].map((y, i) => (
                        <mesh key={i} position={[0.04, y, 0]} rotation={[0, 0, Math.PI / 3]} castShadow>
                            <coneGeometry args={[0.02, 0.05, 4]} />
                            <meshStandardMaterial color="#166534" />
                        </mesh>
                    ))}
                    {/* Flower - layered petals */}
                    {[0, 1, 2].map((layer) => (
                        <group key={layer} position={[0, 0.3 + layer * 0.05, 0]} rotation={[0, layer * 0.3, 0]}>
                            {[0, 1, 2, 3, 4].map((i) => (
                                <mesh 
                                    key={i} 
                                    position={[
                                        Math.cos(i * Math.PI * 2 / 5) * (0.12 - layer * 0.03), 
                                        0, 
                                        Math.sin(i * Math.PI * 2 / 5) * (0.12 - layer * 0.03)
                                    ]}
                                    castShadow
                                >
                                    <sphereGeometry args={[0.08 - layer * 0.015, 8, 6]} />
                                    <meshStandardMaterial color="#dc2626" />
                                </mesh>
                            ))}
                        </group>
                    ))}
                </group>
            );

        case "Tulip":
            return (
                <group position={position}>
                    {/* Stem */}
                    <mesh position={[0, -0.3, 0]} castShadow>
                        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
                        <meshStandardMaterial color="#16a34a" />
                    </mesh>
                    {/* Leaves */}
                    {[-0.15, -0.05].map((y, i) => (
                        <mesh key={i} position={[0.1 * (i % 2 === 0 ? 1 : -1), y, 0]} rotation={[0, 0, 0.5 * (i % 2 === 0 ? 1 : -1)]} castShadow>
                            <boxGeometry args={[0.3, 0.15, 0.02]} />
                            <meshStandardMaterial color="#22c55e" />
                        </mesh>
                    ))}
                    {/* Tulip flower (cup shape) */}
                    <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                        <coneGeometry args={[0.12, 0.3, 6, 1, true]} />
                        <meshStandardMaterial color="#ec4899" side={2} />
                    </mesh>
                    {/* Stamen */}
                    <mesh position={[0, 0.25, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.15, 6]} />
                        <meshStandardMaterial color="#fbbf24" />
                    </mesh>
                </group>
            );

        case "Daisy":
            return (
                <group position={position}>
                    {/* Stem */}
                    <mesh position={[0, -0.3, 0]} castShadow>
                        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
                        <meshStandardMaterial color="#4d7c0f" />
                    </mesh>
                    {/* Flower center */}
                    <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                        <sphereGeometry args={[0.08, 12, 12]} />
                        <meshStandardMaterial color="#fbbf24" />
                    </mesh>
                    {/* White petals */}
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * Math.PI / 4) * 0.12, 
                                0.1, 
                                Math.sin(i * Math.PI / 4) * 0.12
                            ]}
                            castShadow
                        >
                            <sphereGeometry args={[0.06, 8, 8]} />
                            <meshStandardMaterial color="#fafafa" />
                        </mesh>
                    ))}
                </group>
            );

        case "Poppy":
            return (
                <group position={position}>
                    {/* Stem */}
                    <mesh position={[0, -0.25, 0]} castShadow>
                        <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
                        <meshStandardMaterial color="#15803d" />
                    </mesh>
                    {/* Flower - 4 large petals */}
                    {[0, 1, 2, 3].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * Math.PI / 2) * 0.15, 
                                0.2, 
                                Math.sin(i * Math.PI / 2) * 0.15
                            ]} 
                            rotation={[Math.PI / 6, i * Math.PI / 2, 0]}
                            castShadow
                        >
                            <boxGeometry args={[0.18, 0.22, 0.01]} />
                            <meshStandardMaterial color="#ef4444" />
                        </mesh>
                    ))}
                    {/* Black center */}
                    <mesh position={[0, 0.2, 0]} castShadow>
                        <sphereGeometry args={[0.05, 12, 12]} />
                        <meshStandardMaterial color="#0f172a" />
                    </mesh>
                </group>
            );

        // === MUSHROOMS ===
        case "Red Mushroom":
            return (
                <group position={position}>
                    {/* Stem */}
                    <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.08, 0.06, 0.4, 12]} />
                        <meshStandardMaterial color="#fef3c7" />
                    </mesh>
                    {/* Cap */}
                    <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
                        <sphereGeometry args={[0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    {/* White spots */}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * 1.26) * 0.12, 
                                -0.05 + Math.random() * 0.08, 
                                Math.sin(i * 1.26) * 0.12
                            ]}
                        >
                            <sphereGeometry args={[0.04, 8, 8]} />
                            <meshStandardMaterial color="#fafafa" />
                        </mesh>
                    ))}
                </group>
            );

        case "Brown Mushroom":
            return (
                <group position={position}>
                    {/* Stem */}
                    <mesh position={[0, -0.45, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.06, 0.05, 0.3, 10]} />
                        <meshStandardMaterial color="#e7e5e4" />
                    </mesh>
                    {/* Cap (flatter) */}
                    <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.18, 0.15, 0.15, 16]} />
                        <meshStandardMaterial color="#78350f" />
                    </mesh>
                    {/* Cap top detail */}
                    <mesh position={[0, -0.17, 0]}>
                        <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
                        <meshStandardMaterial color="#92400e" />
                    </mesh>
                </group>
            );

        case "Glowing Mushroom":
            return (
                <group position={position}>
                    {/* Stem - glowing */}
                    <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.05, 0.04, 0.4, 12]} />
                        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.3} />
                    </mesh>
                    {/* Cap - bright glow */}
                    <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
                        <sphereGeometry args={[0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial 
                            color="#8b5cf6" 
                            emissive="#8b5cf6" 
                            emissiveIntensity={0.6} 
                        />
                    </mesh>
                    {/* Glowing particles */}
                    {[0, 1, 2].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * 2.094) * 0.15, 
                                -0.1 + Math.sin(Date.now() * 0.002 + i) * 0.05, 
                                Math.sin(i * 2.094) * 0.15
                            ]}
                        >
                            <sphereGeometry args={[0.02, 8, 8]} />
                            <meshBasicMaterial color="#c4b5fd" />
                        </mesh>
                    ))}
                </group>
            );

        // === TREES ===
        case "Oak Tree":
            return (
                <group position={position}>
                    {/* Trunk */}
                    <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.12, 0.15, 0.8, 8]} />
                        <meshStandardMaterial color="#8b4513" roughness={0.9} />
                    </mesh>
                    {/* Foliage - layered spheres */}
                    <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                        <sphereGeometry args={[0.3, 12, 10]} />
                        <meshStandardMaterial color="#4d7c0f" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.35, 0]} castShadow>
                        <sphereGeometry args={[0.25, 12, 10]} />
                        <meshStandardMaterial color="#65a30d" roughness={0.9} />
                    </mesh>
                </group>
            );

        case "Pine Tree":
            return (
                <group position={position}>
                    {/* Trunk */}
                    <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.08, 0.1, 0.6, 8]} />
                        <meshStandardMaterial color="#5d4a37" roughness={0.9} />
                    </mesh>
                    {/* Conical layers */}
                    {[0, 1, 2].map((layer) => (
                        <mesh 
                            key={layer} 
                            position={[0, 0.05 + layer * 0.25, 0]} 
                            castShadow 
                            receiveShadow
                        >
                            <coneGeometry args={[0.3 - layer * 0.08, 0.4, 8]} />
                            <meshStandardMaterial color="#2d5016" roughness={0.9} />
                        </mesh>
                    ))}
                </group>
            );

        case "Palm Tree":
            return (
                <group position={position}>
                    {/* Curved trunk */}
                    <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0.15]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.08, 0.1, 0.9, 8]} />
                        <meshStandardMaterial color="#a0522d" roughness={0.85} />
                    </mesh>
                    {/* Trunk segments */}
                    {[0.3, 0.5, 0.7].map((y, i) => (
                        <mesh key={i} position={[0, -0.2 + y, 0]} rotation={[0, 0, 0.15]}>
                            <torusGeometry args={[0.1, 0.02, 8, 12]} />
                            <meshStandardMaterial color="#8b4513" />
                        </mesh>
                    ))}
                    {/* Palm leaves */}
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <mesh 
                            key={i} 
                            position={[0, 0.4, 0]} 
                            rotation={[Math.PI / 6, i * Math.PI / 3, 0]}
                            castShadow
                        >
                            <boxGeometry args={[0.08, 0.5, 0.02]} />
                            <meshStandardMaterial color="#22c55e" />
                        </mesh>
                    ))}
                </group>
            );

        case "Cherry Blossom":
            return (
                <group position={position}>
                    {/* Trunk */}
                    <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.1, 0.12, 0.7, 8]} />
                        <meshStandardMaterial color="#78350f" roughness={0.9} />
                    </mesh>
                    {/* Pink foliage */}
                    <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                        <sphereGeometry args={[0.28, 12, 10]} />
                        <meshStandardMaterial color="#f9a8d4" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.3, 0]} castShadow>
                        <sphereGeometry args={[0.22, 12, 10]} />
                        <meshStandardMaterial color="#fda4af" roughness={0.8} />
                    </mesh>
                    {/* Falling petals */}
                    {[0, 1, 2].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * 2.094) * 0.3, 
                                -0.1 - i * 0.1, 
                                Math.sin(i * 2.094) * 0.3
                            ]}
                        >
                            <boxGeometry args={[0.04, 0.04, 0.01]} />
                            <meshStandardMaterial color="#fecdd3" />
                        </mesh>
                    ))}
                </group>
            );

        // === ROCKS & NATURAL ===
        case "Boulder":
            return (
                <group position={position}>
                    {/* Main rock - irregular */}
                    <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                        <dodecahedronGeometry args={[0.35, 0]} />
                        <meshStandardMaterial color="#57534e" roughness={0.95} />
                    </mesh>
                    {/* Additional smaller rocks */}
                    <mesh position={[0.2, -0.6, 0.15]} castShadow receiveShadow>
                        <dodecahedronGeometry args={[0.15, 0]} />
                        <meshStandardMaterial color="#78716c" roughness={0.9} />
                    </mesh>
                    <mesh position={[-0.15, -0.6, -0.1]} castShadow receiveShadow>
                        <dodecahedronGeometry args={[0.12, 0]} />
                        <meshStandardMaterial color="#6b7280" roughness={0.9} />
                    </mesh>
                </group>
            );

        case "Crystal Cluster":
            return (
                <group position={position}>
                    {/* Base */}
                    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.18, 0.2, 0.15, 8]} />
                        <meshStandardMaterial color="#44403c" roughness={0.8} />
                    </mesh>
                    {/* Crystal shards at various angles */}
                    {[
                        { pos: [0, -0.3, 0], rot: [0, 0, 0], scale: 0.25 },
                        { pos: [0.12, -0.35, 0.08], rot: [0.3, 0.5, 0.2], scale: 0.18 },
                        { pos: [-0.1, -0.38, -0.05], rot: [-0.2, -0.3, -0.15], scale: 0.15 },
                        { pos: [0.05, -0.35, -0.12], rot: [0.15, -0.4, 0.1], scale: 0.2 },
                    ].map((crystal, i) => (
                        <mesh 
                            key={i} 
                            position={crystal.pos as [number, number, number]} 
                            rotation={crystal.rot as [number, number, number]}
                            castShadow
                        >
                            <coneGeometry args={[crystal.scale * 0.4, crystal.scale * 2, 6]} />
                            <meshStandardMaterial 
                                color="#a855f7" 
                                emissive="#a855f7" 
                                emissiveIntensity={0.3} 
                                transparent 
                                opacity={0.8} 
                            />
                        </mesh>
                    ))}
                </group>
            );

        case "Cactus":
            return (
                <group position={position}>
                    {/* Main body */}
                    <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.12, 0.12, 0.8, 8]} />
                        <meshStandardMaterial color="#15803d" roughness={0.7} />
                    </mesh>
                    {/* Arms */}
                    <mesh position={[-0.2, -0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
                        <meshStandardMaterial color="#16a34a" roughness={0.7} />
                    </mesh>
                    <mesh position={[0.2, 0.05, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.25, 8]} />
                        <meshStandardMaterial color="#16a34a" roughness={0.7} />
                    </mesh>
                    {/* Spines */}
                    {[...Array(12)].map((_, i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * Math.PI / 6) * 0.13, 
                                -0.6 + (i % 5) * 0.15, 
                                Math.sin(i * Math.PI / 6) * 0.13
                            ]}
                            rotation={[0, i * Math.PI / 6, Math.PI / 2]}
                        >
                            <coneGeometry args={[0.01, 0.05, 4]} />
                            <meshStandardMaterial color="#fef3c7" />
                        </mesh>
                    ))}
                </group>
            );

        case "Bamboo":
            return (
                <group position={position}>
                    {/* Bamboo stalks */}
                    {[0, 1, 2].map((stalk) => (
                        <group key={stalk} position={[stalk * 0.12 - 0.12, 0, 0]}>
                            {/* Main stalk */}
                            <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
                                <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
                                <meshStandardMaterial color="#65a30d" />
                            </mesh>
                            {/* Segments */}
                            {[0, 1, 2, 3].map((segment) => (
                                <mesh key={segment} position={[0, -0.6 + segment * 0.25, 0]}>
                                    <torusGeometry args={[0.045, 0.01, 8, 12]} />
                                    <meshStandardMaterial color="#4d7c0f" />
                                </mesh>
                            ))}
                            {/* Leaves at top */}
                            {[0, 1, 2].map((leaf) => (
                                <mesh 
                                    key={leaf} 
                                    position={[0, 0.25, 0]} 
                                    rotation={[Math.PI / 6, leaf * Math.PI * 2 / 3, 0]}
                                    castShadow
                                >
                                    <boxGeometry args={[0.02, 0.2, 0.01]} />
                                    <meshStandardMaterial color="#84cc16" />
                                </mesh>
                            ))}
                        </group>
                    ))}
                </group>
            );

        // === SPECIAL ===
        case "Lantern":
            return (
                <group position={position}>
                    {/* Post */}
                    <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
                        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top hook */}
                    <mesh position={[0, 0.25, 0]}>
                        <torusGeometry args={[0.08, 0.02, 8, 12, Math.PI]} />
                        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
                    </mesh>
                    {/* Lantern cage */}
                    <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.12, 0.12, 0.25, 6]} />
                        <meshStandardMaterial 
                            color="#1f2937" 
                            wireframe={true} 
                            opacity={0.8} 
                            transparent 
                        />
                    </mesh>
                    {/* Light source */}
                    <mesh position={[0, 0.15, 0]}>
                        <sphereGeometry args={[0.08, 12, 12]} />
                        <meshStandardMaterial 
                            color="#fbbf24" 
                            emissive="#fbbf24" 
                            emissiveIntensity={0.8} 
                        />
                    </mesh>
                </group>
            );

        case "Fountain":
            return (
                <group position={position}>
                    {/* Base basin */}
                    <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.35, 0.3, 0.25, 16]} />
                        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.3} />
                    </mesh>
                    {/* Middle tier */}
                    <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.2, 0.15, 0.15, 16]} />
                        <meshStandardMaterial color="#d1d5db" roughness={0.4} metalness={0.3} />
                    </mesh>
                    {/* Center pillar */}
                    <mesh position={[0, -0.1, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
                        <meshStandardMaterial color="#e5e7eb" roughness={0.3} metalness={0.4} />
                    </mesh>
                    {/* Water droplets */}
                    {[0, 1, 2, 3].map((i) => (
                        <mesh 
                            key={i} 
                            position={[
                                Math.cos(i * Math.PI / 2) * 0.08, 
                                0.1 + Math.sin(Date.now() * 0.003 + i) * 0.05, 
                                Math.sin(i * Math.PI / 2) * 0.08
                            ]}
                        >
                            <sphereGeometry args={[0.02, 8, 8]} />
                            <meshStandardMaterial 
                                color="#3b82f6" 
                                transparent 
                                opacity={0.6} 
                            />
                        </mesh>
                    ))}
                </group>
            );

        case "Statue":
            return (
                <group position={position}>
                    {/* Pedestal */}
                    <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
                        <meshStandardMaterial color="#78716c" roughness={0.7} />
                    </mesh>
                    {/* Base of statue */}
                    <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} />
                        <meshStandardMaterial color="#a8a29e" roughness={0.6} />
                    </mesh>
                    {/* Abstract figure */}
                    <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
                        <capsuleGeometry args={[0.1, 0.35, 8, 12]} />
                        <meshStandardMaterial color="#d6d3d1" roughness={0.5} />
                    </mesh>
                    {/* Head */}
                    <mesh position={[0, 0.25, 0]} castShadow>
                        <sphereGeometry args={[0.12, 12, 12]} />
                        <meshStandardMaterial color="#e7e5e4" roughness={0.5} />
                    </mesh>
                </group>
            );

        case "Garden Gnome":
            return (
                <group position={position}>
                    {/* Body */}
                    <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                        <coneGeometry args={[0.15, 0.4, 8]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    {/* Face/head base */}
                    <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
                        <sphereGeometry args={[0.12, 12, 12]} />
                        <meshStandardMaterial color="#fde68a" />
                    </mesh>
                    {/* Hat */}
                    <mesh position={[0, -0.05, 0]} castShadow>
                        <coneGeometry args={[0.14, 0.35, 8]} />
                        <meshStandardMaterial color="#991b1b" />
                    </mesh>
                    {/* Beard */}
                    <mesh position={[0, -0.3, 0.08]} castShadow>
                        <coneGeometry args={[0.08, 0.2, 6]} />
                        <meshStandardMaterial color="#f3f4f6" />
                    </mesh>
                    {/* Base */}
                    <mesh position={[0, -0.65, 0]} receiveShadow>
                        <cylinderGeometry args={[0.18, 0.18, 0.1, 8]} />
                        <meshStandardMaterial color="#65a30d" />
                    </mesh>
                </group>
            );

        default:
            // Fallback for unknown decorative blocks
            return (
                <group position={position}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[0.5, 0.8, 0.5]} />
                        <meshStandardMaterial color="#4A7C59" />
                    </mesh>
                </group>
            );
        }
    };
    
    return renderBlock();
};

export default DecorativeBlock;
