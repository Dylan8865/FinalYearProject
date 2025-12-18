import React, { useState } from "react";

const AddIslandInput = ({
  id,
  type,
  placeholder,
  color,
  width,
}: {
  id: string;
  type: string;
  placeholder: string;
  color: string;
  width: string;
}) => {
  const [value, setValue] = useState<string>("");
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative" style={{ width }}>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full rounded-md border border-gray-300 bg-transparent px-3 py-3 text-sm outline-none transition-all"
        style={{
          borderColor: focused ? color : "#d1d5db", // gray-300
          boxShadow: focused ? `0 0 0 2px ${color}70` : undefined, // ring effect
        }}
      />

      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3 rounded bg-black px-1.5 transition-all ${
          value || focused ? "-top-2 text-xs" : "top-3 text-sm"
        } text-gray-400`} // label color consistent
      >
        {placeholder}
      </label>
    </div>
  );
};

export default AddIslandInput;
