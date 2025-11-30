// Database schema interfaces matching your Supabase tables

export interface User {
  id: string; // uuid
  created_at: string; // timestamp with time zone
  name: string | null;
  email: string | null;
  password: string | null;
  last_login_time: string | null; // timestamp without time zone
  oxygen: number | null; // bigint
  level: number | null; // smallint
}

export interface Island {
  id: string; // uuid
  created_at: string; // timestamp with time zone
  name: string | null;
  level: number | null; // smallint
  theme: string | null;
  user_id: string; // uuid - foreign key to user.id
}

export interface Item {
  id: string; // uuid
  created_at: string; // timestamp with time zone
  name: string | null;
  oxygen_rate: number | null; // integer
  type: string | null;
  oxygen_required: number | null; // bigint
}

export interface IslandItem {
  id: string; // uuid
  created_at: string; // timestamp with time zone
  title: string | null;
  cover_image: string | null;
  level: number | null; // smallint
  grid_x: number | null; // smallint
  grid_y: number | null; // smallint
  grid_z: number | null; // smallint
  island_id: string; // uuid - foreign key to island.id
  item_id: string; // uuid - foreign key to item.id
  pos_x: number | null; // smallint
  pos_y: number | null; // smallint
  user_id: string; // uuid - foreign key to user.id
}

export interface ItemData {
  id: number; // bigint (auto-generated)
  created_at: string; // timestamp with time zone
  type: string | null;
  content: any; // jsonb
  island_item_id: string; // uuid - foreign key to island-item.id
  valid: boolean | null;
}

// Mock Users matching database schema
export const MOCK_USERS: User[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-01-15T10:00:00Z",
    name: "Mike Explorer",
    email: "mike@example.com",
    password: null,
    last_login_time: "2025-11-27T08:30:00",
    oxygen: 15000,
    level: 15,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    created_at: "2023-11-20T14:30:00Z",
    name: "Sakura Dreams",
    email: "sakura@example.com",
    password: null,
    last_login_time: "2025-11-27T09:15:00",
    oxygen: 28900,
    level: 22,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    created_at: "2024-03-10T09:00:00Z",
    name: "Dragon Knight",
    email: "knight@example.com",
    password: null,
    last_login_time: "2025-11-26T20:45:00",
    oxygen: 19200,
    level: 18,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    created_at: "2024-06-05T16:20:00Z",
    name: "Ocean Vibes",
    email: "ocean@example.com",
    password: null,
    last_login_time: "2025-11-27T07:00:00",
    oxygen: 9800,
    level: 12,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    created_at: "2023-08-12T11:30:00Z",
    name: "Tech Wizard",
    email: "wizard@example.com",
    password: null,
    last_login_time: "2025-11-27T10:00:00",
    oxygen: 35000,
    level: 25,
  },
];

// Mock Items (game items that can be placed on islands)
export const MOCK_ITEMS: Item[] = [
  {
    id: "650e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-01-01T00:00:00Z",
    name: "Oak Tree",
    oxygen_rate: 5,
    type: "nature",
    oxygen_required: 50,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440002",
    created_at: "2024-01-01T00:00:00Z",
    name: "Stone Statue",
    oxygen_rate: 0,
    type: "decoration",
    oxygen_required: 200,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440003",
    created_at: "2024-01-01T00:00:00Z",
    name: "Fountain",
    oxygen_rate: 3,
    type: "decoration",
    oxygen_required: 300,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440004",
    created_at: "2024-01-01T00:00:00Z",
    name: "Cherry Blossom",
    oxygen_rate: 8,
    type: "nature",
    oxygen_required: 150,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440005",
    created_at: "2024-01-01T00:00:00Z",
    name: "Lamp Post",
    oxygen_rate: 0,
    type: "decoration",
    oxygen_required: 75,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440006",
    created_at: "2024-01-01T00:00:00Z",
    name: "Small House",
    oxygen_rate: -10,
    type: "building",
    oxygen_required: 500,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440007",
    created_at: "2024-01-01T00:00:00Z",
    name: "Windmill",
    oxygen_rate: 15,
    type: "building",
    oxygen_required: 800,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440008",
    created_at: "2024-01-01T00:00:00Z",
    name: "Mushroom",
    oxygen_rate: 2,
    type: "nature",
    oxygen_required: 25,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440009",
    created_at: "2024-01-01T00:00:00Z",
    name: "Flower Patch",
    oxygen_rate: 4,
    type: "nature",
    oxygen_required: 30,
  },
  {
    id: "650e8400-e29b-41d4-a716-446655440010",
    created_at: "2024-01-01T00:00:00Z",
    name: "Bench",
    oxygen_rate: 0,
    type: "decoration",
    oxygen_required: 40,
  },
];

// Mock Islands (user-owned islands)
export const MOCK_ISLANDS: Island[] = [
  {
    id: "750e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-02-01T10:00:00Z",
    name: "Sky Haven",
    level: 8,
    theme: "skyworld",
    user_id: "550e8400-e29b-41d4-a716-446655440001", // Mike Explorer
  },
  {
    id: "750e8400-e29b-41d4-a716-446655440002",
    created_at: "2024-02-15T14:30:00Z",
    name: "Mountain Peak",
    level: 12,
    theme: "rock",
    user_id: "550e8400-e29b-41d4-a716-446655440001", // Mike Explorer
  },
  {
    id: "750e8400-e29b-41d4-a716-446655440003",
    created_at: "2023-12-15T12:00:00Z",
    name: "Cherry Blossom Garden",
    level: 15,
    theme: "japanese",
    user_id: "550e8400-e29b-41d4-a716-446655440002", // Sakura Dreams
  },
  {
    id: "750e8400-e29b-41d4-a716-446655440004",
    created_at: "2024-04-01T09:00:00Z",
    name: "Dragon's Fortress",
    level: 10,
    theme: "medieval",
    user_id: "550e8400-e29b-41d4-a716-446655440003", // Dragon Knight
  },
  {
    id: "750e8400-e29b-41d4-a716-446655440005",
    created_at: "2024-07-10T16:00:00Z",
    name: "Tropical Paradise",
    level: 6,
    theme: "beach",
    user_id: "550e8400-e29b-41d4-a716-446655440004", // Ocean Vibes
  },
  {
    id: "750e8400-e29b-41d4-a716-446655440006",
    created_at: "2023-09-20T08:30:00Z",
    name: "Neon Nexus",
    level: 18,
    theme: "cyberpunk",
    user_id: "550e8400-e29b-41d4-a716-446655440005", // Tech Wizard
  },
];

// Mock Island Items (items placed on specific islands)
export const MOCK_ISLAND_ITEMS: IslandItem[] = [
  // Items on Sky Haven (Island 1 - Mike's first island)
  {
    id: "850e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-02-02T10:30:00Z",
    title: "Main Oak Tree",
    cover_image: null,
    level: 1,
    grid_x: 2,
    grid_y: 0,
    grid_z: 3,
    island_id: "750e8400-e29b-41d4-a716-446655440001",
    item_id: "650e8400-e29b-41d4-a716-446655440001", // Oak Tree
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440001", // Mike Explorer
  },
  {
    id: "850e8400-e29b-41d4-a716-446655440002",
    created_at: "2024-02-03T11:00:00Z",
    title: "Center Fountain",
    cover_image: null,
    level: 1,
    grid_x: 0,
    grid_y: 0,
    grid_z: 0,
    island_id: "750e8400-e29b-41d4-a716-446655440001",
    item_id: "650e8400-e29b-41d4-a716-446655440003", // Fountain
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440001",
  },
  {
    id: "850e8400-e29b-41d4-a716-446655440003",
    created_at: "2024-02-04T12:00:00Z",
    title: "Resting Bench",
    cover_image: null,
    level: 1,
    grid_x: -1,
    grid_y: 0,
    grid_z: 2,
    island_id: "750e8400-e29b-41d4-a716-446655440001",
    item_id: "650e8400-e29b-41d4-a716-446655440010", // Bench
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440001",
  },

  // Items on Cherry Blossom Garden (Island 3 - Sakura's island)
  {
    id: "850e8400-e29b-41d4-a716-446655440004",
    created_at: "2023-12-16T14:00:00Z",
    title: "East Cherry Blossom",
    cover_image: null,
    level: 2,
    grid_x: 3,
    grid_y: 0,
    grid_z: 3,
    island_id: "750e8400-e29b-41d4-a716-446655440003",
    item_id: "650e8400-e29b-41d4-a716-446655440004", // Cherry Blossom
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440002", // Sakura Dreams
  },
  {
    id: "850e8400-e29b-41d4-a716-446655440005",
    created_at: "2023-12-16T15:00:00Z",
    title: "West Cherry Blossom",
    cover_image: null,
    level: 2,
    grid_x: -3,
    grid_y: 0,
    grid_z: -3,
    island_id: "750e8400-e29b-41d4-a716-446655440003",
    item_id: "650e8400-e29b-41d4-a716-446655440004", // Cherry Blossom
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440002",
  },
  {
    id: "850e8400-e29b-41d4-a716-446655440006",
    created_at: "2023-12-17T10:00:00Z",
    title: "Central Statue",
    cover_image: null,
    level: 2,
    grid_x: 0,
    grid_y: 0,
    grid_z: 0,
    island_id: "750e8400-e29b-41d4-a716-446655440003",
    item_id: "650e8400-e29b-41d4-a716-446655440002", // Stone Statue
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440002",
  },

  // Items on Neon Nexus (Island 6 - Tech Wizard's island)
  {
    id: "850e8400-e29b-41d4-a716-446655440007",
    created_at: "2023-09-21T09:00:00Z",
    title: "North Lamp",
    cover_image: null,
    level: 3,
    grid_x: 4,
    grid_y: 0,
    grid_z: 4,
    island_id: "750e8400-e29b-41d4-a716-446655440006",
    item_id: "650e8400-e29b-41d4-a716-446655440005", // Lamp Post
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440005", // Tech Wizard
  },
  {
    id: "850e8400-e29b-41d4-a716-446655440008",
    created_at: "2023-09-21T09:30:00Z",
    title: "South Lamp",
    cover_image: null,
    level: 3,
    grid_x: -4,
    grid_y: 0,
    grid_z: 4,
    island_id: "750e8400-e29b-41d4-a716-446655440006",
    item_id: "650e8400-e29b-41d4-a716-446655440005", // Lamp Post
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440005",
  },
  {
    id: "850e8400-e29b-41d4-a716-446655440009",
    created_at: "2023-09-22T10:00:00Z",
    title: "Energy Generator",
    cover_image: null,
    level: 4,
    grid_x: 0,
    grid_y: 0,
    grid_z: 0,
    island_id: "750e8400-e29b-41d4-a716-446655440006",
    item_id: "650e8400-e29b-41d4-a716-446655440007", // Windmill
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440005",
  },

  // Items on Tropical Paradise (Island 5 - Ocean Vibes's island)
  {
    id: "850e8400-e29b-41d4-a716-446655440010",
    created_at: "2024-07-11T10:00:00Z",
    title: "Garden Flowers",
    cover_image: null,
    level: 1,
    grid_x: 2,
    grid_y: 0,
    grid_z: 1,
    island_id: "750e8400-e29b-41d4-a716-446655440005",
    item_id: "650e8400-e29b-41d4-a716-446655440009", // Flower Patch
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440004", // Ocean Vibes
  },
  {
    id: "850e8400-e29b-41d4-a716-446655440011",
    created_at: "2024-07-12T11:00:00Z",
    title: "Decorative Mushrooms",
    cover_image: null,
    level: 1,
    grid_x: -2,
    grid_y: 0,
    grid_z: -1,
    island_id: "750e8400-e29b-41d4-a716-446655440005",
    item_id: "650e8400-e29b-41d4-a716-446655440008", // Mushroom
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440004",
  },
  {
    id: "850e8400-e29b-41d4-a716-446655440012",
    created_at: "2024-07-13T12:00:00Z",
    title: "Beach House",
    cover_image: null,
    level: 2,
    grid_x: 0,
    grid_y: 0,
    grid_z: 3,
    island_id: "750e8400-e29b-41d4-a716-446655440005",
    item_id: "650e8400-e29b-41d4-a716-446655440006", // Small House
    pos_x: 0,
    pos_y: 0,
    user_id: "550e8400-e29b-41d4-a716-446655440004",
  },
];

// Mock Item Data (analysis cache and metadata for island items)
export const MOCK_ITEM_DATA: ItemData[] = [
  {
    id: 1,
    created_at: "2024-02-02T10:35:00Z",
    type: "analysis",
    content: {
      oxygenProduction: 5,
      healthStatus: "healthy",
      growthStage: "mature",
      lastAnalyzed: "2024-02-02T10:35:00Z",
    },
    island_item_id: "850e8400-e29b-41d4-a716-446655440001", // Main Oak Tree
    valid: true,
  },
  {
    id: 2,
    created_at: "2024-02-03T11:05:00Z",
    type: "analysis",
    content: {
      waterFlow: "optimal",
      aestheticScore: 95,
      visitorRating: 4.8,
      maintenanceRequired: false,
    },
    island_item_id: "850e8400-e29b-41d4-a716-446655440002", // Center Fountain
    valid: true,
  },
  {
    id: 3,
    created_at: "2023-12-16T14:10:00Z",
    type: "analysis",
    content: {
      oxygenProduction: 8,
      blossomCount: 245,
      seasonalBonus: true,
      healthStatus: "excellent",
      petalFallRate: "moderate",
    },
    island_item_id: "850e8400-e29b-41d4-a716-446655440004", // East Cherry Blossom
    valid: true,
  },
  {
    id: 4,
    created_at: "2023-12-16T15:10:00Z",
    type: "analysis",
    content: {
      oxygenProduction: 8,
      blossomCount: 238,
      seasonalBonus: true,
      healthStatus: "excellent",
      petalFallRate: "moderate",
    },
    island_item_id: "850e8400-e29b-41d4-a716-446655440005", // West Cherry Blossom
    valid: true,
  },
  {
    id: 5,
    created_at: "2023-09-21T09:10:00Z",
    type: "energy_consumption",
    content: {
      powerUsage: 15,
      efficiency: 87,
      lightIntensity: "high",
      nightMode: true,
    },
    island_item_id: "850e8400-e29b-41d4-a716-446655440007", // North Lamp
    valid: true,
  },
  {
    id: 6,
    created_at: "2023-09-22T10:15:00Z",
    type: "production",
    content: {
      oxygenProduction: 15,
      energyGenerated: 120,
      efficiency: 92,
      rotationSpeed: "optimal",
      windConditions: "favorable",
    },
    island_item_id: "850e8400-e29b-41d4-a716-446655440009", // Energy Generator (Windmill)
    valid: true,
  },
  {
    id: 7,
    created_at: "2024-07-11T10:30:00Z",
    type: "analysis",
    content: {
      oxygenProduction: 4,
      flowerVariety: ["roses", "tulips", "daisies"],
      bloomCycle: "spring-summer",
      healthStatus: "good",
    },
    island_item_id: "850e8400-e29b-41d4-a716-446655440010", // Garden Flowers
    valid: true,
  },
  {
    id: 8,
    created_at: "2024-07-13T12:30:00Z",
    type: "building_stats",
    content: {
      oxygenConsumption: -10,
      residents: 2,
      comfortLevel: 85,
      maintenanceStatus: "good",
      upgradeAvailable: true,
    },
    island_item_id: "850e8400-e29b-41d4-a716-446655440012", // Beach House
    valid: true,
  },
];

// Helper functions
export const getUserById = (id: string): User | undefined => {
  return MOCK_USERS.find((user) => user.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return MOCK_USERS.find((user) => user.email === email);
};

export const getIslandsByUserId = (userId: string): Island[] => {
  return MOCK_ISLANDS.filter((island) => island.user_id === userId);
};

export const getIslandById = (id: string): Island | undefined => {
  return MOCK_ISLANDS.find((island) => island.id === id);
};

export const getItemById = (id: string): Item | undefined => {
  return MOCK_ITEMS.find((item) => item.id === id);
};

export const getIslandItemsByIslandId = (islandId: string): IslandItem[] => {
  return MOCK_ISLAND_ITEMS.filter((item) => item.island_id === islandId);
};

export const getIslandItemsByUserId = (userId: string): IslandItem[] => {
  return MOCK_ISLAND_ITEMS.filter((item) => item.user_id === userId);
};

export const getTopUsers = (limit: number = 10): User[] => {
  return [...MOCK_USERS]
    .sort((a, b) => (b.level || 0) - (a.level || 0) || (b.oxygen || 0) - (a.oxygen || 0))
    .slice(0, limit);
};

export const getItemDataByIslandItemId = (islandItemId: string): ItemData[] => {
  return MOCK_ITEM_DATA.filter((data) => data.island_item_id === islandItemId);
};

export const getValidItemData = (): ItemData[] => {
  return MOCK_ITEM_DATA.filter((data) => data.valid === true);
};

export const getItemDataByType = (type: string): ItemData[] => {
  return MOCK_ITEM_DATA.filter((data) => data.type === type);
};
