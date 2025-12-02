import IslandIcon from "@/icons/IslandIcon";
import SeedlingIcon from "@/icons/SeedlingIcon";
import StoreIcon from "@/icons/StoreIcon";
import TrophyIcon from "@/icons/TrophyIcon";
import React from "react";

const FeatureSection = () => {
  return (
    <div className="relative z-10 bg-white/95 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-4 text-center text-4xl font-bold text-[#72b9e3]">
          What is Wisdom Island?
        </h2>
        <p className="mb-16 text-center text-lg text-gray-600">
          A unique platform where knowledge grows like nature. Build your
          personal island of wisdom, one item at a time.
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* feature 1 */}
          <div className="group flex flex-col items-center space-y-4 rounded-lg border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] transition hover:scale-105 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-4 border-black bg-[#7CB342] text-3xl text-white">
              <IslandIcon />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Build Your Island
            </h3>
            <p className="text-center text-sm text-gray-600">
              Create your personal knowledge island and watch it grow with every
              item you add
            </p>
          </div>

          {/* feature 2 */}
          <div className="group flex flex-col items-center space-y-4 rounded-lg border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] transition hover:scale-105 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-4 border-black bg-[#68a5ad] text-3xl text-white">
              <SeedlingIcon />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Collect Items</h3>
            <p className="text-center text-sm text-gray-600">
              Gather various items to decorate and expand your island with
              trees, rocks, and more
            </p>
          </div>

          {/* feature 3 */}
          <div className="group flex flex-col items-center space-y-4 rounded-lg border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] transition hover:scale-105 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-4 border-black bg-[#6d3f33] text-3xl text-white">
              <StoreIcon />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Visit the Store</h3>
            <p className="text-center text-sm text-gray-600">
              Browse and purchase new items to enhance your island and make it
              unique
            </p>
          </div>

          {/* feature 4 */}
          <div className="group flex flex-col items-center space-y-4 rounded-lg border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] transition hover:scale-105 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-4 border-black bg-[#FFA726] text-3xl text-white">
              <TrophyIcon />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Track Progress</h3>
            <p className="text-center text-sm text-gray-600">
              Monitor your island's growth and celebrate your achievements as
              you build
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;
