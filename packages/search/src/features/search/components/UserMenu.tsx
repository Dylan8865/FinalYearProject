"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "@/features/auth/actions/logout";
import { useTheme } from "../context/ThemeContext";

interface UserMenuProps {
  email: string;
}

export default function UserMenu({ email }: UserMenuProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";
  const menuBg = isDark ? "bg-[#2A2A2A]" : "bg-white";
  const menuBorder = isDark ? "border-[#3B3B3B]" : "border-gray-200";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const mutedTextColor = isDark ? "text-gray-300" : "text-gray-700";
  const hoverBg = isDark ? "hover:bg-[#3B3B3B]" : "hover:bg-gray-100";
  const borderColor = isDark ? "border-[#3B3B3B]" : "border-gray-200";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  // Get first letter of email for avatar
  const avatarLetter = email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-base font-medium text-white transition-colors hover:bg-teal-500"
        title={email}
      >
        {avatarLetter}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-72 rounded-lg border ${menuBorder} ${menuBg} py-2 shadow-lg`}>
          {/* Email */}
          <div className={`border-b ${borderColor} px-5 py-4`}>
            <p className={`truncate text-base ${textColor}`}>{email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Analytics */}
            <a
              href="/analytics"
              className={`flex w-full items-center gap-4 px-5 py-3 text-left text-base ${mutedTextColor} ${hoverBg}`}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Analytics</span>
            </a>
          </div>

          {/* Logout */}
          <div className={`border-t ${borderColor} py-2`}>
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-4 px-5 py-3 text-left text-base ${mutedTextColor} ${hoverBg}`}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
