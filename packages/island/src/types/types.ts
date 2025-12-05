export interface ProfileType {
  id: string;
  created_at: string;
  name: string;
  email: string;
  last_login_time: string;
  oxygen: number;
  level: number;
  type: string;
}

export interface IslandType {
  id: string;
  created_at: string;
  name: string;
  level: number;
  theme: string;
  profile_id: string;
  user: ProfileType;
}

export interface ItemType {
  id: string;
  created_at: string;
  name: string;
  oxygen_rate: number;
  type: string;
  oxygen_required: number;
  image_cover_path?: string;
  model_path?: string;
  model_url?: string;
}

export interface IslandItemType {
  id: string;
  created_at: string;
  title: string | null;
  cover_image: string | null;
  level: number | null;
  grid_x: number | null;
  grid_y: number | null;
  grid_z: number | null;
  island_id: string | null;
  item_id: string;
  pos_x: number | null;
  pos_y: number | null;
  profile_id: string;
  item?: ItemType;
  island?: IslandType;
}

export interface IslandTypeWithPosition extends IslandType {
  position: [number, number, number];
  gridSize: number;
}
