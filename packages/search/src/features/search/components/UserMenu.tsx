"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { signOut } from "@/features/auth/actions/logout";
import { deleteAccount } from "@/features/auth/actions/deleteAccount";
import { useTheme } from "../context/ThemeContext";

interface UserMenuProps {
  email: string;
  name?: string;
}

export default function UserMenu({ email, name }: UserMenuProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

  const handleDeleteAccount = () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Get first letter of name or email for avatar
  const avatarLetter = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

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
          {/* Name and Email */}
          <div className={`border-b ${borderColor} px-5 py-4`}>
            {name && (
              <p className={`mb-1 text-base font-medium ${textColor}`}>{name}</p>
            )}
            <p className={`truncate text-sm ${mutedTextColor}`}>{email}</p>
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

          {/* Logout & Delete */}
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

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`flex w-full items-center gap-4 px-5 py-3 text-left text-base text-red-500 ${hoverBg}`}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`w-full max-w-md rounded-lg ${menuBg} border ${menuBorder} p-6 shadow-xl`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold ${textColor}`}>Delete Account</h3>
            </div>

            <div className="mb-6 space-y-3">
              <div className={`rounded border-2 border-red-900/20 bg-red-900/10 p-4`}>
                <p className="mb-2 text-center font-bold text-red-500">
                  This action cannot be undone!
                </p>
                <p className={`mb-2 text-center text-sm ${mutedTextColor}`}>
                  This will permanently delete:
                </p>
                <ul className={`space-y-1 text-sm ${mutedTextColor}`}>
                  <li>• Your account and profile</li>
                  <li>• All your chats</li>
                  <li>• All your search history</li>
                  <li>• All your feedback data</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className={`block text-center text-sm ${textColor}`}>
                  Type <span className="font-bold text-red-500">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={`w-full rounded border-2 ${borderColor} ${menuBg} p-3 text-center ${textColor} focus:border-red-500 focus:outline-none disabled:opacity-50`}
                  placeholder="DELETE"
                  disabled={isPending}
                />
              </div>

              {error && (
                <div className="rounded border border-red-900/20 bg-red-900/10 p-3 text-center text-sm text-red-500">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText("");
                  setError(null);
                }}
                className={`rounded px-6 py-2 ${hoverBg} ${textColor} border ${borderColor}`}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isPending || confirmText !== "DELETE"}
                className={`rounded px-6 py-2 ${
                  isPending || confirmText !== "DELETE"
                    ? "cursor-not-allowed bg-red-900/30 text-red-800/50"
                    : "cursor-pointer bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
