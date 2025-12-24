/**
 * Navigation URLs for the Wisdom Island ecosystem.
 * These are configured via environment variables to support both
 * local multi-port development and production subdomains.
 */

export const NAV_URLS = {
  // @wisdom-island/cloud (Port 3002)
  CLOUD: process.env.NEXT_PUBLIC_CLOUD_URL || "http://localhost:3002",

  // @wisdom-island/explore (Port 3003)
  EXPLORE: process.env.NEXT_PUBLIC_EXPLORE_URL || "http://localhost:3003",

  // @wisdom-island/island (Port 3004)
  ISLAND: process.env.NEXT_PUBLIC_ISLAND_URL || "http://localhost:3004",

  // @wisdom-island/search (Port 3005)
  SEARCH: process.env.NEXT_PUBLIC_SEARCH_URL || "http://localhost:3005",
};
