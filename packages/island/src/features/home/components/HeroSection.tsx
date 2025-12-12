import IslandIcon from "@/features/shared/icons/IslandIcon";
import LoginIcon from "@/features/shared/icons/LoginIcon";
import ScrollDownIcon from "@/features/shared/icons/ScrollDownIcon";
import UserIcon from "@/features/shared/icons/UserIcon";
import Link from "next/link";
import React from "react";

const HeroSection = () => {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-12 flex flex-col items-center space-y-4">
        <div className="text-8xl text-white drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)]">
          <IslandIcon />
        </div>
        <h1 className="text-5xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
          Wisdom Island
        </h1>
        <p className="text-center text-xl text-white/90 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]">
          Build and manage your knowledge island
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-6">
        <Link href="/login">
          <button className="group flex h-14 w-52 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition hover:scale-105 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.3)]">
            <div className="flex h-full w-16 items-center justify-center bg-[#6d3f33] text-2xl text-white transition group-hover:bg-[#8a5544]">
              <LoginIcon />
            </div>
            <div className="flex w-full items-center justify-center border-s-4 border-black bg-[#d9d9d9] font-bold text-black transition group-hover:bg-[#e5e7eb]">
              Login
            </div>
          </button>
        </Link>

        <Link href="/register">
          <button className="group flex h-14 w-52 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition hover:scale-105 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.3)]">
            <div className="flex h-full w-16 items-center justify-center bg-[#68a5ad] text-2xl text-white transition group-hover:bg-[#7fb9c2]">
              <UserIcon />
            </div>
            <div className="flex w-full items-center justify-center border-s-4 border-black bg-[#d9d9d9] font-bold text-black transition group-hover:bg-[#e5e7eb]">
              Register
            </div>
          </button>
        </Link>
      </div>

      {/* scroll */}
      <div className="mt-16 animate-bounce text-white/70">
        <ScrollDownIcon />
      </div>
    </div>
  );
};

export default HeroSection;
