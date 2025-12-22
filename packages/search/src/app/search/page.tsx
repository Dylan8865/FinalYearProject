import SearchPage from "@/features/search/components/SearchPage";
import { createClient } from "@/lib/supabase/server";

export default async function Search() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return <SearchPage user={user} />;
  } catch (error) {
    console.error("Search page auth error:", error);
    // Return page without user if auth fails
    return <SearchPage user={null} />;
  }
}