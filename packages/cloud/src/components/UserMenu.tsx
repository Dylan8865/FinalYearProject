"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  name: string;
  email: string;
}

export default function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Get first letter of name for avatar
  const avatarLetter = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-base font-medium text-white transition-colors hover:bg-green-500"
        title={name || email}
      >
        {avatarLetter}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-gray-700 bg-gray-800 py-2 shadow-lg">
          {/* Name and Email */}
          <div className="border-b border-gray-700 px-5 py-4">
            {name && (
              <p className="mb-1 text-base font-medium text-white">{name}</p>
            )}
            <p className="truncate text-sm text-gray-300">{email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                router.push("/favorites");
                setIsOpen(false);
              }}
              className="w-full px-5 py-3 text-left text-base text-gray-300 transition-colors hover:bg-gray-700"
            >
              ⭐ Favorites
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-5 py-3 text-left text-base text-red-400 transition-colors hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
