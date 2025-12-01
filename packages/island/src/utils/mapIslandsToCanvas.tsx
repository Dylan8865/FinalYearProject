import { IslandTypeWithPosition, IslandType } from "../types";

export function mapIslandsToCanvas(
  dbIslands: IslandType[],
  minDistance = 8,
  seed?: string
): IslandTypeWithPosition[] {
  const mappedIslands: IslandTypeWithPosition[] = [];

  dbIslands.forEach((dbIsland, index) => {
    let position: [number, number, number];
    let attempts = 0;
    const maxAttempts = 100;

    const islandSeed = seed ? hashCode(dbIsland.id + seed) : Math.random();

    do {
      const randomX = seed
        ? seededRandom(islandSeed + index * 1000)
        : Math.random();
      const randomY = seed
        ? seededRandom(islandSeed + index * 2000)
        : Math.random();
      const randomZ = seed
        ? seededRandom(islandSeed + index * 3000)
        : Math.random();

      position = [(randomX - 0.5) * 20, randomY * 10 + 1, (randomZ - 0.5) * 20];
      attempts++;

      if (attempts >= maxAttempts) {
        position = [
          (randomX - 0.5) * 30 + index * 2,
          randomY * 20 + index * 2,
          (randomZ - 0.5) * 30 + index * 2,
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

    // Level 1 = gridSize 5
    // Level 2 = gridSize 7
    // Level 3 = gridSize 9
    const gridSize = Math.min(Math.max(dbIsland.level * 2 + 3, 5), 9);

    console.log(
      `Island ${dbIsland.name} - Level: ${dbIsland.level}, GridSize: ${gridSize}`
    );

    mappedIslands.push({
      id: dbIsland.id,
      created_at: dbIsland.created_at,
      name: dbIsland.name,
      level: dbIsland.level,
      theme: dbIsland.theme,
      user_id: dbIsland.user_id,
      user: dbIsland.user,
      position,
      gridSize,
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
  dbIslands: IslandType[],
  radius = 15,
  heightVariation = 2
): IslandTypeWithPosition[] {
  return dbIslands.map((dbIsland, index) => {
    const angle = (index / dbIslands.length) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 2 + (Math.random() - 0.5) * heightVariation;

    const gridSize = Math.min(Math.max(dbIsland.level * 2 + 3, 5), 9);

    return {
      id: dbIsland.id,
      created_at: dbIsland.created_at,
      name: dbIsland.name,
      level: dbIsland.level,
      theme: dbIsland.theme,
      user_id: dbIsland.user_id,
      user: dbIsland.user,
      position: [x, y, z],
      gridSize,
    };
  });
}

/**
 * Arranges islands in a grid pattern
 */
export function arrangeIslandsGrid(
  dbIslands: IslandType[],
  columns = 3,
  spacing = 10
): IslandTypeWithPosition[] {
  return dbIslands.map((dbIsland, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    const x = (col - (columns - 1) / 2) * spacing;
    const z = (row - Math.floor(dbIslands.length / columns) / 2) * spacing;
    const y = 2 + (Math.random() - 0.5) * 1;

    const gridSize = Math.min(Math.max(dbIsland.level * 2 + 3, 5), 9);

    return {
      id: dbIsland.id,
      created_at: dbIsland.created_at,
      name: dbIsland.name,
      level: dbIsland.level,
      theme: dbIsland.theme,
      user_id: dbIsland.user_id,
      user: dbIsland.user,
      position: [x, y, z],
      gridSize,
    };
  });
}
