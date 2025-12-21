import { CloudWord, CloudTopic } from "@/types/types";

/**
 * Calculate word positions for cloud layout
 */
export function calculateWordPositions(words: CloudWord[]): CloudWord[] {
  return words.map((word, index) => ({
    ...word,
    x: Math.random() * 80 + 10, // 10-90% range
    y: Math.random() * 70 + 15, // 15-85% range
  }));
}

/**
 * Filter words based on search query
 */
export function filterCloudWords(
  words: CloudWord[],
  searchQuery: string
): CloudWord[] {
  if (!searchQuery.trim()) return words;
  
  const query = searchQuery.toLowerCase();
  return words.filter((word) =>
    word.text.toLowerCase().includes(query)
  );
}

/**
 * Sort topics by different criteria
 */
export function sortTopics(
  topics: CloudTopic[],
  sortBy: "newest" | "oldest" | "popular" | "trending"
): CloudTopic[] {
  const sorted = [...topics];
  
  switch (sortBy) {
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case "popular":
      return sorted.sort((a, b) => b.count - a.count);
    case "trending":
      return sorted.filter((t) => t.trending).concat(sorted.filter((t) => !t.trending));
    default:
      return sorted;
  }
}

/**
 * Get word size based on weight/popularity
 */
export function getWordSize(weight: number, minSize = 24, maxSize = 72): number {
  // Normalize weight to size range
  const normalizedWeight = Math.min(Math.max(weight, 0), 100) / 100;
  return minSize + normalizedWeight * (maxSize - minSize);
}
