"use client";

import { Html } from "@react-three/drei";
import ManaIcon from "@/icons/ManaIcon";
import CloseIcon from "@/icons/CloseIcon";
import { toCapitalise } from "@/lib/capitalise";
import { useState } from "react";

interface IslandTooltipProps {
  islandName: string;
  islandDescription: string;
  islandTheme: string;
  islandLevel: number;
  manaRate: number;
  accumulatedMana: number;
  itemCount: number;
  visible: boolean;
  onCollectClick?: () => void;
  onEditClick?: () => void;
  onUpgradeClick?: () => void;
  userMana?: number;
  onTooltipHover?: (isHovered: boolean) => void;
  onClose?: () => void;
}

/**
 * IslandTooltip Component
 *
 * Displays island statistics when hovering over an island.
 * Shows:
 * - Island name and level
 * - Total mana rate (per minute)
 * - Accumulated mana ready to collect
 * - Quick collect button
 *
 * Features:
 * - Stays visible when hovering over the tooltip itself
 * - Has close button for mobile/tablet touch interactions
 */
const IslandTooltip = ({
  islandName,
  islandDescription,
  islandTheme,
  islandLevel,
  manaRate,
  accumulatedMana,
  itemCount,
  visible,
  onCollectClick,
  onEditClick,
  onUpgradeClick,
  userMana = 0,
  onTooltipHover,
  onClose,
}: IslandTooltipProps) => {
  if (!visible) return null;

  const isCollectionLocked = accumulatedMana < 1000;

  const [isCollecting, setIsCollecting] = useState(false);

  return (
    <Html
      position={[0, -2, 0]}
      center
      distanceFactor={15}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="select-none"
        onMouseEnter={() => onTooltipHover?.(true)}
        onMouseLeave={() => onTooltipHover?.(false)}
        style={{
          background:
            "linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95))",
          color: "white",
          padding: "12px 16px",
          borderRadius: "12px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "14px",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.2)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          minWidth: "200px",
          maxWidth: "320px",
          width: "max-content",
          backdropFilter: "blur(8px)",
          position: "relative",
        }}
      >
        {/* Close button for mobile/tablet */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              position: "absolute",
              top: "14px",
              right: "8px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(255, 255, 255, 0.1)",
              color: "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              lineHeight: "1",
              padding: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#9ca3af";
            }}
          >
            <CloseIcon />
          </button>
        )}

        {/* Header */}
        <div
          className="flex items-center justify-center"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            paddingBottom: "8px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingRight: onClose ? "20px" : "0",
          }}
        >
          <span
            className="mr-4 flex-1 truncate"
            title={islandName || "My Island"}
            style={{ fontWeight: "600", fontSize: "16px" }}
          >
            {islandName || "My Island"}
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {islandLevel == 3 ? `Max Lv. ${islandLevel}` : `Lv. ${islandLevel}`}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Island's description */}
          <div className="flex flex-col items-start justify-between gap-1">
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>
              Description
            </span>
            <span
              className="flex-1 text-wrap"
              title={toCapitalise(islandDescription)}
              style={{ color: "#fff", fontWeight: "400", fontSize: "13px" }}
            >
              {toCapitalise(islandDescription)}
            </span>
          </div>

          {/* Island's theme */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>Theme</span>
            <span
              className="ml-4 flex-1 truncate text-right"
              title={toCapitalise(islandTheme)}
              style={{ color: "#fff", fontWeight: "400", fontSize: "13px" }}
            >
              {toCapitalise(islandTheme)}
            </span>
          </div>

          {/* Mana Rate */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>
              Mana Rate
            </span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  color: "#fbbf24",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                {manaRate}
              </span>
              <span style={{ color: "#9ca3af", fontSize: "11px" }}>/m</span>
            </div>
          </div>

          {/* Accumulated Mana */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              className="flex items-center justify-center gap-1"
              style={{ color: "#9ca3af", fontSize: "12px" }}
            >
              Accumulated
              <ManaIcon width={12} height={12} />
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                className="truncate"
                style={{
                  color: accumulatedMana > 0 ? "#34d399" : "#9ca3af",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                {new Intl.NumberFormat("en").format(
                  Math.floor(accumulatedMana)
                )}
              </span>
            </div>
          </div>

          {/* Items on Island */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>
              Items Placed
            </span>
            <span
              style={{ color: "#60a5fa", fontWeight: "500", fontSize: "13px" }}
            >
              {itemCount}
            </span>
          </div>
        </div>

        {/* Collect Button */}
        {!isCollectionLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollecting(true);
              const success = onCollectClick && onCollectClick();
              if (success) {
                setIsCollecting(false);
              }
            }}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "8px 16px",
              background: isCollecting
                ? "#8B4513"
                : "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
              border: "none",
              borderRadius: "8px",
              color: isCollecting ? "#fff" : "#8B4513",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(255, 215, 0, 0.3)",
              transition: "transform 0.1s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <ManaIcon />
            <span>{isCollecting ? "Collecting..." : "Collect"}</span>
          </button>
        )}

        {/* Upgrade Button */}
        {(() => {
          const upgrades = {
            1: 10_000_000,
            2: 100_000_000,
          };
          const nextLevel = (islandLevel + 1) as 2 | 3;
          const cost = upgrades[islandLevel as 1 | 2];

          if (!cost || islandLevel >= 3) return null;

          const canAfford = userMana >= cost;
          const missingMana = cost - userMana;

          return (
            <div className="group relative w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (canAfford && onUpgradeClick) {
                    onUpgradeClick();
                  }
                }}
                disabled={!canAfford}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "6px 16px",
                  background: canAfford
                    ? "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: canAfford
                    ? "none"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: canAfford ? "#064e3b" : "#6b7280",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: canAfford ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: canAfford
                    ? "0 4px 12px rgba(74, 222, 128, 0.3)"
                    : "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (canAfford)
                    e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  if (canAfford) e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <span>Upgrade (Lv {nextLevel})</span>
              </button>

              {/* Cost Tooltip */}
              <div
                className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 rounded bg-black/90 p-2 text-xs text-white opacity-0 shadow-lg group-hover:block group-hover:opacity-100"
                style={{
                  zIndex: 1000, // Ensure it's on top of other elements
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Cost:</span>
                    <span className="font-bold text-[#fbbf24]">
                      {new Intl.NumberFormat("en").format(cost)}
                    </span>
                    <ManaIcon width={10} height={10} />
                  </div>
                  {!canAfford && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400">
                      <span>Missing:</span>
                      <span>
                        {new Intl.NumberFormat("en").format(missingMana)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[rgba(255,255,255,0.1)] bg-black/90"></div>
              </div>
            </div>
          );
        })()}

        {/* Edit Button */}
        {onEditClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "6px 16px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "#e5e7eb",
              fontWeight: "500",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#e5e7eb";
            }}
          >
            <span>Edit Island</span>
          </button>
        )}
      </div>
    </Html>
  );
};

export default IslandTooltip;
