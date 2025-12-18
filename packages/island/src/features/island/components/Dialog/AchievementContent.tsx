import React, { useState } from "react";
import { IslandItemType, IslandTypeWithPosition } from "@/types/types";
import QuestionIcon from "@/icons/QuestionIcon";
import TrophyIcon from "@/icons/TrophyIcon";
import IslandIcon from "@/icons/IslandIcon";
import { calculateIslandTotalManaRate } from "@/utils/manaCalculations";

interface AchievementContentProps {
  islands: IslandTypeWithPosition[];
  islandItems: IslandItemType[];
}

const AchievementContent = ({
  islands,
  islandItems,
}: AchievementContentProps) => {
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  // Calculate Total Level
  const totalLevel = islands.reduce(
    (acc, island) => acc + (island.level || 0),
    0
  );

  // Calculate Item Stats
  const functionalCount = islandItems.filter(
    (i) => i.item?.type === "functional"
  ).length;
  const decorativeCount = islandItems.filter(
    (i) => i.item?.type === "decorative"
  ).length;
  const terrainCount = islandItems.filter(
    (i) => i.item?.type === "terrain"
  ).length;

  const placedCount = islandItems.filter((i) => i.grid_x !== null).length;
  const inventoryCount = islandItems.filter((i) => i.grid_x === null).length;
  const totalItems = islandItems.length;
  // Calculate total mana rate across all islands
  const totalManaRateAll = islands.reduce((acc, island) => {
    return acc + calculateIslandTotalManaRate(island, islandItems);
  }, 0);

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto p-4">
      {/* Total Level Section */}
      <div className="relative flex items-center justify-between rounded-lg border border-[#68a5ad]/50 bg-[#68a5ad]/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#68a5ad] text-2xl text-white">
            <TrophyIcon />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-300">Total Level</h3>
            <p className="text-2xl font-bold text-white">{totalLevel}</p>
          </div>
        </div>
        <div
          className="cursor-pointer text-xl text-gray-400 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            setShowLevelInfo(!showLevelInfo);
          }}
        >
          <QuestionIcon />
        </div>

        {/* Tooltip for Level Info */}
        {showLevelInfo && (
          <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-md border border-gray-600 bg-[#2a2a2a] p-3 text-xs text-gray-300 shadow-xl">
            <p className="mb-1 font-semibold text-white">How Level Works:</p>
            <p>
              Your global level is the sum of all your island levels. Upgrade
              your islands to increase your total level!
            </p>
            <p className="mt-2 italic text-gray-400">
              Example: Island A (Lvl 1) + Island B (Lvl 2) = Global Level 3
            </p>
          </div>
        )}
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Total Islands" value={islands.length} />
        <StatCard title="Total Items" value={totalItems} />
        <StatCard title="Total Rates" value={`${totalManaRateAll}/m`} />
        <StatCard title="Placed Items" value={placedCount} />
        <StatCard title="In Inventory" value={inventoryCount} />
        <StatCard title="Functional" value={functionalCount} />
        <StatCard title="Decorative" value={decorativeCount} />
        <StatCard title="Terrain" value={terrainCount} />
      </div>

      {/* Islands Breakdown */}
      <div className="flex-1">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-300">
          Island Summary
        </h3>
        <div className="space-y-3">
          {islands.map((island) => {
            // Per island stats
            const islandSpecificItems = islandItems.filter(
              (i) => i.island_id === island.id && i.grid_x !== null
            );
            const totalManaRate = calculateIslandTotalManaRate(
              island,
              islandItems
            );
            return (
              <div
                key={island.id}
                className="flex items-center justify-between rounded-md bg-white/5 p-3 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#5a706b] text-white">
                    <IslandIcon />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {island.name}
                    </h4>
                    <p className="text-xs text-[#68a5ad]">
                      Level {island.level}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-xs text-gray-400">Mana Rate</p>
                    <p className="font-mono text-sm font-bold text-[#4fd1c5]">
                      {totalManaRate}/m
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Items Placed</p>
                    <p className="font-mono text-sm font-bold text-white">
                      {islandSpecificItems.length}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) => (
  <div className="flex flex-col rounded bg-white/5 p-3 text-center transition-colors hover:bg-white/10">
    <span className="text-xs text-gray-400">{title}</span>
    <span className="text-lg font-bold text-white">{value}</span>
  </div>
);

export default AchievementContent;
