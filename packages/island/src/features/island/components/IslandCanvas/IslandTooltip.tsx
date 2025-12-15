"use client";

import { Html } from "@react-three/drei";
import ManaIcon from "@/icons/ManaIcon";
import CloseIcon from "@/icons/CloseIcon";

interface IslandTooltipProps {
  islandName: string;
  islandLevel: number;
  manaRate: number;
  accumulatedMana: number;
  itemCount: number;
  visible: boolean;
  onCollectClick?: () => void;
  onTooltipHover?: (isHovered: boolean) => void;
  onClose?: () => void;
}

/**
 * IslandTooltip Component
 *
 * Displays island statistics when hovering over an island.
 * Shows:
 * - Island name and level
 * - Total mana rate (per second)
 * - Accumulated mana ready to collect
 * - Quick collect button
 * 
 * Features:
 * - Stays visible when hovering over the tooltip itself
 * - Has close button for mobile/tablet touch interactions
 */
const IslandTooltip = ({
  islandName,
  islandLevel,
  manaRate,
  accumulatedMana,
  itemCount,
  visible,
  onCollectClick,
  onTooltipHover,
  onClose,
}: IslandTooltipProps) => {
  if (!visible) return null;

  return (
    <Html
      position={[0, -2, 0]}
      center
      distanceFactor={15}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "auto" }}
    >
      <div
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
          minWidth: "180px",
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
              top: "8px",
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

        {/* Header */}x
        <div
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
          <span style={{ fontWeight: "600", fontSize: "16px" }}>
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
            Lv. {islandLevel}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
              <span style={{ color: "#9ca3af", fontSize: "11px" }}>/s</span>
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
              className="flex gap-1 justify-center items-center"
              style={{ color: "#9ca3af", fontSize: "12px" }}
            >
              Accumulated
              <ManaIcon width={12} height={12} />
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
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
        {accumulatedMana >= 1 && onCollectClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCollectClick();
            }}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "8px 16px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(16, 185, 129, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(16, 185, 129, 0.3)";
            }}
          >
            <ManaIcon />
            <span>Collect</span>
          </button>
        )}
      </div>
    </Html>
  );
};

export default IslandTooltip;
