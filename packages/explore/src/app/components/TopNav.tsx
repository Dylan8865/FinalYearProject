"use client";

import Link from "next/link";

const TopNav = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#0b0b0c]/90 backdrop-blur border-b border-white/10">
      <div className="flex items-center justify-between px-10 py-4">
        {/* Left: menu + nav */}
        <div className="flex items-center gap-10">
          {/* Menu icon */}
          <div className="text-white opacity-80 cursor-default">☰</div>

          {/* Nav links (LEFT aligned) */}
          <nav className="flex items-center gap-8 text-sm text-gray-400">
            <Link href="#" className="hover:text-white transition">
              Search
            </Link>

            <Link href="#" className="hover:text-white transition">
              Cloud
            </Link>

            {/* Active: Explore */}
            <Link href="#" className="relative text-white">
              Explore
              <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-white rounded-full" />
            </Link>
          </nav>
        </div>

       {/* Right: sign in */}
<div className="flex items-center">
  <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-white/20 transition">
    Sign in
  </button>
</div>
    
      </div>
    </header>
  );
};

export default TopNav;
