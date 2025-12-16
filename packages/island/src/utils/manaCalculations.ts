/**
 * Mana Calculations Utility
 *
 * Handles all mana rate calculations for islands and items.
 * All rates are expressed as MANA PER MINUTE.
 *
 * Island Base Mana Rates (per minute):
 * - Level 1: 9 mana/minute
 * - Level 2: 25 mana/minute
 * - Level 3: 49 mana/minute
 *
 * Formula: (level * 2 - 1)^2 + level^2 = base rate
 * Simplified: (2*level - 1)^2 for odd squares pattern
 *
 * Item mana_rate in database = mana per minute
 */

import { IslandItemType, IslandType } from "@/types/types";

/**
 * Base mana rates by island level (per minute)
 * Level 1: 9/m, Level 2: 25/m, Level 3: 49/m
 * Pattern: (2n - 1)^2 where n is the level
 */
export const ISLAND_BASE_MANA_RATES: Record<number, number> = {
  1: 9,
  2: 25,
  3: 49,
};

/**
 * Gets the base mana rate for an island based on its level
 * Uses lookup table with fallback to formula for higher levels
 *
 * @param level - Island level (1, 2, 3, etc.)
 * @returns Mana per minute base rate
 */
export function getIslandBaseManaRate(level: number): number {
  // Use lookup for known levels, formula for unknown
  if (ISLAND_BASE_MANA_RATES[level] !== undefined) {
    return ISLAND_BASE_MANA_RATES[level];
  }
  // Formula: (2n - 1)^2 for higher levels
  return Math.pow(2 * level - 1, 2);
}

/**
 * Calculates the total mana rate for an island including all placed items
 *
 * @param island - The island object with level
 * @param placedItems - Array of island items placed on this island
 * @returns Total mana per minute
 */
export function calculateIslandTotalManaRate(
  island: { id: string; level: number },
  placedItems: IslandItemType[]
): number {
  const baseManaRate = getIslandBaseManaRate(island.level || 1);

  // Sum up mana rates from all placed items on this island
  const itemManaRate = placedItems
    .filter((item) => item.island_id === island.id && item.grid_x !== null)
    .reduce((total, item) => {
      const itemRate = item.item?.mana_rate || 0;
      return total + itemRate;
    }, 0);

  return baseManaRate + itemManaRate;
}

/**
 * Calculates accumulated mana based on time elapsed
 *
 * @param manaRate - Mana per second
 * @param elapsedSeconds - Time elapsed in seconds
 * @param maxAccumulation - Maximum mana that can accumulate (optional cap)
 * @returns Accumulated mana amount
 */
export function calculateAccumulatedMana(
  manaRate: number,
  elapsedSeconds: number,
  maxAccumulation?: number
): number {
  const accumulated = Math.floor(manaRate * elapsedSeconds);
  if (maxAccumulation !== undefined) {
    return Math.min(accumulated, maxAccumulation);
  }
  return accumulated;
}

/**
 * Maximum time (in seconds) mana can accumulate before capping
 * Default: 24 hours (86400 seconds)
 */
export const MAX_ACCUMULATION_TIME = 86400;

/**
 * Minimum mana required before the aura visual effect appears
 */
export const MIN_MANA_FOR_AURA = 10;

/**
 * Thresholds for aura intensity based on accumulated mana percentage
 */
export const AURA_INTENSITY_THRESHOLDS = {
  low: 0.25, // 25% of max - subtle glow
  medium: 0.5, // 50% of max - moderate glow
  high: 0.75, // 75% of max - strong glow
  full: 1.0, // 100% of max - maximum glow with particles
};
