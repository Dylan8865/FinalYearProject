// Cloud-related types

export interface CloudWord {
  id: string;
  text: string;
  size: number;
  x: number;
  y: number;
  weight: number;
  category?: string;
}

export interface CloudTopic {
  id: string;
  name: string;
  count: number;
  trending: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "article" | "video" | "podcast";
  category: string;
  duration: string;
  created_at: string;
}

export interface CloudFilter {
  category: string;
  sortBy: "newest" | "oldest" | "popular" | "trending";
  searchQuery: string;
}
