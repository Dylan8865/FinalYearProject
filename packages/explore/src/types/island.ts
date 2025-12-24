export interface IslandType {
  id: string;
  created_at: string;
  name: string;
  level: number;
  description: string;
  theme: string;
  profile_id: string;
}

export interface ItemType {
  id: string;
  name: string;
  type: string;
  image_cover_path?: string;
  image_cover_url?: string;
}

export interface IslandItemType {
  id: string;
  created_at: string;
  island_id: string | null;
  item_id: string;
  pos_x: number | null;
  pos_y: number | null;
  pos_z: number | null;
  grid_x: number | null;
  grid_y: number | null;
  grid_z: number | null;
  level: number | null;
  title: string | null;
  image_cover_path: string | null;
  item?: ItemType;
}

export interface ItemDataType {
  id: string;
  created_at: string;
  type: string | null;
  content: any | null;
  island_item_id: string | null;
  valid: boolean | null;
  order_index: number | null;
}
