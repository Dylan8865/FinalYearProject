import React from "react";

interface BlockContextMenuProps {
    position: { x: number; y: number };
    itemType: "terrain" | "decorative" | "functional";
    onOpen?: () => void;
    onRemove: () => void;
    onClose: () => void;
}

/**
 * BlockContextMenu Component - Context menu for placed blocks
 * 
 * Triggers: Right-click, Press-and-hold (500ms), Hover (1000ms)
 * 
 * Options based on item type:
 * - Terrain: Only "Remove"
 * - Decorative: Only "Remove"
 * - Functional: "Open" + "Remove"
 */
const BlockContextMenu = ({ position, itemType, onOpen, onRemove, onClose }: BlockContextMenuProps) => {
    const showOpenButton = itemType === "functional";

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />

            {/* Context Menu */}
            <div
                className="fixed z-50 min-w-[120px] rounded-md border border-gray-600 bg-gray-800 shadow-lg"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <div className="py-1">
                    {showOpenButton && onOpen && (
                        <button
                            className="w-full px-4 py-2 text-left text-sm text-white transition hover:bg-gray-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen();
                                onClose();
                            }}
                        >
                            Open
                        </button>
                    )}
                    <button
                        className="w-full px-4 py-2 text-left text-sm text-white transition hover:bg-red-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                            onClose();
                        }}
                    >
                        Remove
                    </button>
                </div>
            </div>
        </>
    );
};

export default BlockContextMenu;
