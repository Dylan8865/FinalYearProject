import { SearchResult, SearchFilters } from "@/types/types";

export function filterResults(
  results: SearchResult[],
  filters: SearchFilters
): SearchResult[] {
  let filtered = [...results];

  // Filter by category
  if (filters.category && filters.category !== "all") {
    filtered = filtered.filter(
      (result) => result.type === filters.category
    );
  }

  // Sort results
  switch (filters.sortBy) {
    case "date":
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      break;
    case "name":
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "relevance":
    default:
      // Keep original order for relevance
      break;
  }

  return filtered;
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}
