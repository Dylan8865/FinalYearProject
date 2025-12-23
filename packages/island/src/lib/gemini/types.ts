// Request types for Gemini validation
export interface ItemDataRequest {
  id: string;
  type: string;
  content: unknown;
}

export interface IslandItemRequest {
  island_item_id: string;
  title: string;
  item_data: ItemDataRequest[];
}

export interface ValidationRequest {
  items: IslandItemRequest[];
}

// Response types from Gemini validation
export interface ItemDataResponse {
  id: string;
  validity: number;
}

export interface IslandItemResponse {
  island_item_id: string;
  validity: number;
  comment: string;
  item_data: ItemDataResponse[];
}

export interface ValidationResponse {
  results: IslandItemResponse[];
}

// Database types
export interface ValidationLog {
  id: string;
  created_at: string;
  status: "queued" | "processing" | "completed" | "failed" | "superseeded";
  item_id: string;
  request: ValidationRequest | IslandItemRequest;
  response: ValidationResponse | null;
  error: string | null;
  retry_count: number;
}

export interface IslandItem {
  id: string;
  title: string | null;
  status: "unverified" | "pending" | "declined" | "verified";
  validity: number | null;
  comment: string | null;
  validation_status: "pending" | "completed" | "error" | null;
}

export interface ItemData {
  id: string;
  type: string | null;
  content: unknown | null;
  island_item_id: string | null;
  validity: number | null;
}
