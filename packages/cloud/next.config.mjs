import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from root .env file
config({ path: resolve(process.cwd(), "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ISLAND_URL: process.env.NEXT_PUBLIC_ISLAND_URL,
    NEXT_PUBLIC_CLOUD_URL: process.env.NEXT_PUBLIC_CLOUD_URL,
    NEXT_PUBLIC_EXPLORE_URL: process.env.NEXT_PUBLIC_EXPLORE_URL,
    NEXT_PUBLIC_SEARCH_URL: process.env.NEXT_PUBLIC_SEARCH_URL,
  },
};

export default nextConfig;
