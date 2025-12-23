// Export all validation-related functions and types for easier imports

// Types
export type {
  ValidationRequest,
  ValidationResponse,
  IslandItemRequest,
  IslandItemResponse,
  ItemDataRequest,
  ItemDataResponse,
  ValidationLog,
  IslandItem,
  ItemData,
} from "./types";

// Gemini client
export { validateWithGemini } from "./client";
