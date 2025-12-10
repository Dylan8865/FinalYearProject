import SearchPage from "@/features/search/components/SearchPage";
import { createClient } from "@/lib/supabase/server";

export default async function Search() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return <SearchPage user={user} />;
}