import SearchPage from "@/features/search/components/SearchPage";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Fetch profile data including name
      const { data: profile } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();
      
      return <SearchPage user={user} profile={profile} />;
    }
    
    return <SearchPage user={null} profile={null} />;
  } catch (error) {
    console.error("Home page auth error:", error);
    // Return page without user if auth fails
    return <SearchPage user={null} profile={null} />;
  }
}
