import { IslandType } from "@/types/types";

export interface IslandTypeWithPosition extends IslandType {
  position: [number, number, number];
  gridSize: number;
}
