import React, { useState, useRef, useEffect } from "react";
import DownArrowIcon from "@/icons/DownArrowIcon";
import { Option } from "./AddIslandContent";
import { useTheme } from "../../contexts/ThemeContext";

interface AddIslandSelectProps {
  id: string;
  options: Option[];
  placeholder: string;
  color: string;
  width: string;
  value: Option | null;
  handleChange: (option: Option) => void;
  error: string;
}

const AddIslandSelect = ({
  id,
  options,
  placeholder,
  color,
  width,
  value,
  handleChange,
  error,
}: AddIslandSelectProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width }}
      className="relative cursor-pointer select-none"
    >
      {/* Select field */}
      <div
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-3 text-sm transition-all"
        style={{
          borderColor: open ? color : "#d1d5db",
          boxShadow: error
            ? `0 0 0 2px #ef4444`
            : open
              ? `0 0 0 2px ${color}33`
              : undefined,
        }}
      >
        <span className={value ? "" : "text-gray-400"}>
          {value ? value.label : placeholder}
        </span>
        <DownArrowIcon
          className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        />
      </div>

      {error && <p className="pt-1 text-xs text-red-500">{error}</p>}

      {/* Floating label */}
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3 rounded ${isDark ? "bg-black" : "bg-white"} px-1.5 transition-all ${
          value || open ? "-top-2 text-xs" : "top-3 text-sm"
        } text-gray-400`} // same gray as input
      >
        {placeholder}
      </label>

      {/* Dropdown options */}
      {open && (
        <div
          className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 ${isDark ? "bg-black" : "bg-white"} shadow-lg`}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                handleChange(opt);
                setOpen(false);
              }}
              className={`px-3 py-2 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"} ${
                value?.value === opt.value ? `bg-gray-800` : ""
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddIslandSelect;
