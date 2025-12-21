import React, { useState } from "react";
import { IslandItemType, IslandTypeWithPosition } from "@/types/types";
import QuestionIcon from "@/icons/QuestionIcon";
import TrophyIcon from "@/icons/TrophyIcon";
import IslandIcon from "@/icons/IslandIcon";
import { calculateIslandTotalManaRate } from "@/utils/manaCalculations";
import { useTheme } from "../../contexts/ThemeContext";

interface AchievementContentProps {
  islands: IslandTypeWithPosition[];
  islandItems: IslandItemType[];
}

const AchievementContent = ({
  islands,
  islandItems,
}: AchievementContentProps) => {
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const { themeColour } = useTheme();
  const isDark = themeColour === "dark";

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
      <div
        className={`relative flex items-center justify-between rounded-lg border ${isDark ? "border-[#68a5ad]/50 bg-[#68a5ad]/20" : "border-[#68a5ad]/70 bg-[#68a5ad]/10"} p-4`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#68a5ad] text-2xl text-white">
            <TrophyIcon />
          </div>
          <div>
            <h3
              className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              Total Level
            </h3>
            <p
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}
            >
              {totalLevel}
            </p>
          </div>
        </div>
        <div
          className={`mt-2 cursor-pointer text-xl ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowLevelInfo(!showLevelInfo);
          }}
        >
          <QuestionIcon />
        </div>

        {/* Tooltip for Level Info */}
        {showLevelInfo && (
          <div
            className={`absolute right-0 top-full z-10 mt-2 w-64 rounded-md border ${isDark ? "border-gray-600 bg-[#2a2a2a] text-gray-300" : "border-gray-300 bg-white text-gray-600"} p-3 text-xs shadow-xl`}
          >
            <p
              className={`mb-1 font-semibold ${isDark ? "text-white" : "text-black"}`}
            >
              How Levels Work
            </p>
            <p>Your global level is the total of all island levels.</p>
            <p
              className={`mt-1 italic ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Example: Lvl 1 + Lvl 2 = Lvl 3
            </p>
          </div>
        )}
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Total Islands"
          value={islands.length}
          isDark={isDark}
        />
        <StatCard title="Total Items" value={totalItems} isDark={isDark} />
        <StatCard
          title="Total Rates"
          value={`${totalManaRateAll}/m`}
          isDark={isDark}
        />
        <StatCard title="Placed Items" value={placedCount} isDark={isDark} />
        <StatCard title="In Inventory" value={inventoryCount} isDark={isDark} />
        <StatCard
          title="Functional Item"
          value={functionalCount}
          isDark={isDark}
        />
        <StatCard
          title="Decorative Item"
          value={decorativeCount}
          isDark={isDark}
        />
        <StatCard title="Terrain Item" value={terrainCount} isDark={isDark} />
      </div>

      {/* Islands Breakdown */}
      <div className="flex-1">
        <h3
          className={`mb-3 text-sm font-bold uppercase tracking-widest ${isDark ? "text-gray-300" : "text-gray-600"}`}
        >
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
                className={`flex items-center justify-between rounded-md ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} p-3 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#5a706b] text-white">
                    <IslandIcon />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}
                    >
                      {island.name}
                    </h4>
                    <p className="text-xs text-[#68a5ad]">
                      Level {island.level}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Mana Rate
                    </p>
                    <p className="font-mono text-sm font-bold text-[#4fd1c5]">
                      {totalManaRate}/m
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Items Placed
                    </p>
                    <p
                      className={`font-mono text-sm font-bold ${isDark ? "text-white" : "text-black"}`}
                    >
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
  isDark,
}: {
  title: string;
  value: string | number;
  isDark: boolean;
}) => (
  <div
    className={`flex flex-col rounded ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} p-3 text-center transition-colors`}
  >
    <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
      {title}
    </span>
    <span
      className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}
    >
      {value}
    </span>
  </div>
);

export default AchievementContent;
