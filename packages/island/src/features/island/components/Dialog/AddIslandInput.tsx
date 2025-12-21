import React, { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const AddIslandInput = ({
  id,
  type,
  placeholder,
  color,
  width,
  value,
  handleChange,
  name,
  error,
}: {
  id: string;
  type: string;
  placeholder: string;
  color: string;
  width: string;
  value: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  error: string;
}) => {
  const [focused, setFocused] = useState(false);
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

  return (
    <div className="relative" style={{ width }}>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full rounded-md border border-gray-300 bg-transparent px-3 py-3 text-sm outline-none transition-all"
        style={{
          borderColor: focused ? color : "#d1d5db", // gray-300
          boxShadow: error
            ? `0 0 0 2px #ef4444`
            : focused
              ? `0 0 0 2px ${color}70`
              : undefined, // ring effect
        }}
      />

      {error && <p className="pt-1 text-xs text-red-500">{error}</p>}

      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3 rounded ${isDark ? "bg-black" : "bg-white"} px-1.5 transition-all ${
          value || focused ? "-top-2 text-xs" : "top-3 text-sm"
        } text-gray-400`} // label color consistent
      >
        {placeholder}
      </label>
    </div>
  );
};

export default AddIslandInput;
