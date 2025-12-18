import React, { useState, useRef, useEffect } from "react";
import DownArrowIcon from "@/icons/DownArrowIcon";

interface Option {
  label: string;
  value: string;
}

interface AddIslandSelectProps {
  id: string;
  options: Option[];
  placeholder: string;
  color: string;
  width: string;
}

const AddIslandSelect = ({
  id,
  options,
  placeholder,
  color,
  width,
}: AddIslandSelectProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Option | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
          boxShadow: open ? `0 0 0 2px ${color}33` : undefined,
        }}
      >
        <span className={value ? "" : "text-gray-400"}>
          {value ? value.label : placeholder}
        </span>
        <DownArrowIcon
          className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        />
      </div>

      {/* Floating label */}
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3 rounded bg-black px-1.5 transition-all ${
          value || open ? "-top-2 text-xs" : "top-3 text-sm"
        } text-gray-400`} // same gray as input
      >
        {placeholder}
      </label>

      {/* Dropdown options */}
      {open && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-black shadow-lg">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                setValue(opt);
                setOpen(false);
              }}
              className={`px-3 py-2 hover:bg-gray-700 ${
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
