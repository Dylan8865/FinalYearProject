import UserIcon from "@/icons/UserIcon";
import Link from "next/link";
import React from "react";

const CTASection = () => {
  return (
    <div className="relative z-10 bg-white py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="mb-6 text-4xl font-bold text-[#72b9e3]">
          Ready to Start Building?
        </h2>
        <p className="mb-8 text-lg text-gray-600">
          Join Wisdom Island today and create your unique knowledge sanctuary.
        </p>

        <div className="flex justify-center gap-6">
          <Link href="/register">
            <button className="group flex h-16 w-64 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.3)] transition hover:scale-105 hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.3)]">
              <div className="flex h-full w-20 items-center justify-center bg-[#68a5ad] text-3xl text-white transition group-hover:bg-[#7fb9c2]">
                <UserIcon />
              </div>
              <div className="flex w-full items-center justify-center border-s-4 border-black bg-[#d9d9d9] text-lg font-bold text-black transition group-hover:bg-[#e5e7eb]">
                Get Started
              </div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CTASection;
