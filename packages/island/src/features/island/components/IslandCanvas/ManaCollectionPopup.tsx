"use client";

import React, { useState, useEffect } from "react";
import ManaIcon from "@/icons/ManaIcon";

interface ManaCollectionPopupProps {
  amount: number;
  visible: boolean;
  onComplete: () => void;
  position?: { x: number; y: number };
}

/**
 * ManaCollectionPopup Component
 *
 * An animated popup that appears when mana is collected.
 * Shows the amount collected with a floating animation.
 */
const ManaCollectionPopup = ({
  amount,
  visible,
  onComplete,
  position = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
}: ManaCollectionPopupProps) => {
  const [animationState, setAnimationState] = useState<
    "entering" | "visible" | "exiting" | "hidden"
  >("hidden");

  useEffect(() => {
    if (visible && amount > 0) {
      setAnimationState("entering");

      // Transition to visible
      const visibleTimer = setTimeout(() => {
        setAnimationState("visible");
      }, 100);

      // Start exit animation
      const exitTimer = setTimeout(() => {
        setAnimationState("exiting");
      }, 1500);

      // Complete
      const completeTimer = setTimeout(() => {
        setAnimationState("hidden");
        onComplete();
      }, 2000);

      return () => {
        clearTimeout(visibleTimer);
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [visible, amount, onComplete]);

  if (animationState === "hidden" || amount <= 0) {
    return null;
  }

  const styles: Record<string, React.CSSProperties> = {
    entering: {
      transform: "translateY(0) scale(0.8)",
      opacity: 0,
    },
    visible: {
      transform: "translateY(-40px) scale(1)",
      opacity: 1,
    },
    exiting: {
      transform: "translateY(-80px) scale(0.9)",
      opacity: 0,
    },
    hidden: {
      display: "none",
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          ...styles[animationState],
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          background:
            "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))",
          borderRadius: "16px",
          boxShadow:
            "0 8px 32px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)",
          border: "2px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <span
          style={{
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ManaIcon />
        </span>
        <span
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "white",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          +{new Intl.NumberFormat("en").format(amount)}
        </span>
      </div>
    </div>
  );
};

export default ManaCollectionPopup;
