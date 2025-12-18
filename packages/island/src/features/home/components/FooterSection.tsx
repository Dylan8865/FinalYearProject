import IslandIcon from "@/icons/IslandIcon";
import React from "react";

const FooterSection = () => {
  return (
    <footer className="relative z-10 border-t-4 border-black bg-[#d9d9d9] py-8">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <div className="mb-4 flex items-center justify-center text-4xl text-black">
          <IslandIcon className="h-10 w-10" />
        </div>
        <p className="mb-4 font-bold text-gray-800">Wisdom Island</p>
        <p className="text-sm text-gray-600">
          © 2025 Wisdom Island. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;
