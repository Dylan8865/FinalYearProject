import { IslandData } from "../components/IslandCanvas";

export interface DBIsland {
  id: string;
  created_at: string;
  name: string | null;
  level: number | null;
  theme: string | null;
  user_id: string | null;
}

interface IslandWithPosition extends IslandData {
  name: string | null;
  level: number | null;
  theme: string | null;
}

/**
 * Maps database islands to canvas positions with collision detection
 * @param dbIslands - Islands from database
 * @param minDistance - Minimum distance between islands
 * @param seed - Optional seed for consistent positioning (use island ID)
 * @returns Array of islands with canvas positions
 */
export function mapIslandsToCanvas(
  dbIslands: DBIsland[],
  minDistance = 8,
  seed?: string
): IslandWithPosition[] {
  const mappedIslands: IslandWithPosition[] = [];

  dbIslands.forEach((dbIsland, index) => {
    let position: [number, number, number];
    let attempts = 0;
    const maxAttempts = 100;

    // Use island ID for seeded randomness (consistent positions per island)
    const islandSeed = seed ? hashCode(dbIsland.id + seed) : Math.random();

    do {
      // Generate position with optional seeding
      const randomX = seed
        ? seededRandom(islandSeed + index * 1000)
        : Math.random();
      const randomY = seed
        ? seededRandom(islandSeed + index * 2000)
        : Math.random();
      const randomZ = seed
        ? seededRandom(islandSeed + index * 3000)
        : Math.random();

      position = [
        (randomX - 0.5) * 20, // X between -10 and 10
        randomY * 3 + 1, // Y between 1 and 4
        (randomZ - 0.5) * 20, // Z between -10 and 10
      ];
      attempts++;

      // If max attempts reached, place it anyway (far from others if possible)
      if (attempts >= maxAttempts) {
        position = [
          (randomX - 0.5) * 30 + index * 5,
          randomY * 3 + 1,
          (randomZ - 0.5) * 30 + index * 5,
        ];
        break;
      }
    } while (
      mappedIslands.some((island) => {
        const dx = island.position[0] - position[0];
        const dy = island.position[1] - position[1];
        const dz = island.position[2] - position[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz) < minDistance;
      })
    );

    // Map level to grid size (level 1-3 = size 4-6)
    const gridSize = Math.min(Math.max((dbIsland.level || 1) + 3, 4), 6);

    mappedIslands.push({
      id: dbIsland.id,
      position,
      gridSize,
      name: dbIsland.name,
      level: dbIsland.level,
      theme: dbIsland.theme,
    });
  });

  return mappedIslands;
}

/**
 * Simple hash function for consistent seeding
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator (0-1)
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Arranges islands in a circular pattern
 */
export function arrangeIslandsCircular(
  dbIslands: DBIsland[],
  radius = 15,
  heightVariation = 2
): IslandWithPosition[] {
  return dbIslands.map((dbIsland, index) => {
    const angle = (index / dbIslands.length) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 2 + (Math.random() - 0.5) * heightVariation;

    const gridSize = Math.min(Math.max((dbIsland.level || 1) + 3, 4), 6);

    return {
      id: dbIsland.id,
      position: [x, y, z],
      gridSize,
      name: dbIsland.name,
      level: dbIsland.level,
      theme: dbIsland.theme,
    };
  });
}

/**
 * Arranges islands in a grid pattern
 */
export function arrangeIslandsGrid(
  dbIslands: DBIsland[],
  columns = 3,
  spacing = 10
): IslandWithPosition[] {
  return dbIslands.map((dbIsland, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    const x = (col - (columns - 1) / 2) * spacing;
    const z = (row - Math.floor(dbIslands.length / columns) / 2) * spacing;
    const y = 2 + (Math.random() - 0.5) * 1;

    const gridSize = Math.min(Math.max((dbIsland.level || 1) + 3, 4), 6);

    return {
      id: dbIsland.id,
      position: [x, y, z],
      gridSize,
      name: dbIsland.name,
      level: dbIsland.level,
      theme: dbIsland.theme,
    };
  });
}
