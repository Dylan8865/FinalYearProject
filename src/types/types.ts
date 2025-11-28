export interface IslandType {
  id: string;
  created_at: string;
  name: string;
  level: number;
  theme: string;
  user_id: string;
  user: UserType;
}

export interface UserType {
  id: string;
  created_at: string;
  name: string;
  email: string;
  password: string;
  last_login_time: string;
  oxygen: number;
  level: number;
}

export interface ItemType {
  id: string;
  created_at: string;
  name: string;
  oxygen_rate: number;
  type: string;
  oxygen_required: number;
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
  user_id: string;
  item?: ItemType;
  island?: IslandType;
}
