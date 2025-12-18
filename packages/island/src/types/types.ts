export interface ProfileType {
  id: string;
  created_at: string;
  name: string;
  email: string;
  last_login_time: string;
  mana: number;
  level: number;
  type: string;
}

export interface IslandType {
  id: string;
  created_at: string;
  name: string;
  level: number;
  genre: string;
  theme: string;
  profile_id: string;
  user: ProfileType;
  accumulated_mana?: number; // Total accumulated mana stored in DB
  last_updated_at?: string; // When accumulated_mana was last synced
}

export interface ItemType {
  id: string;
  created_at: string;
  name: string;
  mana_rate: number;
  type: string;
  mana_required: number;
  image_cover_path?: string;
  model_path?: string;
  model_url?: string;
  image_cover_url?: string; // Pre-resolved public URL from API
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

// Block types supported (like Notion)
export type BlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list"
  | "numbered_list"
  | "todo"
  | "toggle"
  | "quote"
  | "divider"
  | "callout"
  | "code"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "table"
  | "table_row"
  | "bookmark"
  | "embed";

// Properties for different block types
export interface BlockProperties {
  // Text formatting
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;

  // List properties
  checked?: boolean; // For todo items

  // Code block properties
  language?: string;

  // Callout properties
  icon?: string;

  // Media properties
  url?: string;
  caption?: string;
  width?: number;
  height?: number;

  // Table properties
  columnCount?: number;
  rowCount?: number;
  headers?: boolean;

  // Any other custom properties
  [key: string]: any;
}

export interface ItemDataType {
  id: string;
  created_at: string;
  type: BlockType | string | null;
  content: any | null;
  island_item_id: string | null;
  valid: boolean | null;
  order_index: number | null;
  parent_id?: string | null; // For nested blocks
  properties?: BlockProperties | null; // Additional block properties
}
