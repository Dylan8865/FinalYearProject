"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/search", label: "Search" },
    { href: "/cloud", label: "Cloud" },
    { href: "/explore", label: "Explore" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6 bg-[#1a1a1a]/80 backdrop-blur-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center">
          <svg
            viewBox="0 0 40 40"
            className="h-8 w-8 text-teal-400"
            fill="currentColor"
          >
            {/* Simple island/tree icon */}
            <path d="M20 4c-2 0-3.5 1.5-3.5 3.5 0 1.2.6 2.3 1.5 3v2h-2c-1.5 0-2.5 1-2.5 2.5 0 1 .5 1.8 1.2 2.3-.7.5-1.2 1.3-1.2 2.2 0 1.5 1 2.5 2.5 2.5h1v4h-6c-1 0-2 .8-2 2 0 1 .8 2 2 2h18c1 0 2-.8 2-2 0-1-.8-2-2-2h-6v-4h1c1.5 0 2.5-1 2.5-2.5 0-.9-.5-1.7-1.2-2.2.7-.5 1.2-1.3 1.2-2.3 0-1.5-1-2.5-2.5-2.5h-2v-2c.9-.7 1.5-1.8 1.5-3C23.5 5.5 22 4 20 4z" />
          </svg>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors ${
              pathname === link.href
                ? "text-teal-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Sign In Button */}
      <Link
        href="/login"
        className="rounded-full border border-gray-600 px-5 py-1.5 text-sm text-gray-300 transition-colors hover:border-teal-400 hover:text-white"
      >
        Sign in
      </Link>
    </nav>
  );
}
