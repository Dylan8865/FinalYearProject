export function formatDate(
  dateString: string | null,
  fallbackText: string = "N/A"
): string {
  if (!dateString) return fallbackText;
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
