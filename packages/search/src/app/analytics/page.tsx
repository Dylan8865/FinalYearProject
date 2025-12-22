import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/features/search/components/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      redirect("/login?error=session_expired");
    }

    return <AnalyticsDashboard userId={user.id} />;
  } catch (error) {
    console.error("Analytics page auth error:", error);
    redirect("/login?error=auth_error");
  }
}
