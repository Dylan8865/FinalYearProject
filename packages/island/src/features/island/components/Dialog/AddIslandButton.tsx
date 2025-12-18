import React, { useState } from "react";

interface AddIslandButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  color: string;
  width?: string;
}

const AddIslandButton = ({
  onClick,
  children,
  color,
  width,
}: AddIslandButtonProps) => {
  const [hovered, setHovered] = useState(false);

  const darkenColor = (hex: string, amount: number) => {
    let col = hex.replace("#", "");
    if (col.length === 3) {
      col = col
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(col, 16);
    let r = Math.max(0, ((num >> 16) & 0xff) - amount);
    let g = Math.max(0, ((num >> 8) & 0xff) - amount);
    let b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <button
      onClick={onClick}
      style={{
        width,
        backgroundColor: hovered ? darkenColor(color, 30) : color,
        borderRadius: "0.375rem",
        padding: "0.75rem 0.75rem",
        color: "white",
        fontSize: "0.875rem",
        fontWeight: 500,
        transition: "background-color 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
};

export default AddIslandButton;
