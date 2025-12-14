"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "@/features/auth/actions/logout";
import { useTheme } from "../context/ThemeContext";

interface UserMenuProps {
  email: string;
}

export default function UserMenu({ email }: UserMenuProps) {
  const { theme, toggleTheme } = useTheme();
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
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`flex w-full items-center gap-4 px-5 py-3 text-left text-base ${mutedTextColor} ${hoverBg}`}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {theme === "dark" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                )}
              </svg>
              <span>Theme</span>
              <span className={`ml-auto text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>

            {/* Get Help */}
            <a
              href="/help"
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Get help</span>
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
