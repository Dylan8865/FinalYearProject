export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "island" | "item" | "user" | "other";
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchFilters {
  category: string;
  sortBy: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
}
