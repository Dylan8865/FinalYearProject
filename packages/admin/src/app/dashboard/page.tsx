import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import DashboardHeader from "@/features/header/AdminHeader";
import DashboardCards from "@/features/dashboard/DashboardCards";

export default async function DashboardPage() {
  // Single line replaces all auth checks + adds 30min timeout
  const { user, profile } = await requireAdmin();
  
  const supabase = await createClient();

  // Fetch stats from database
  // Shop Management counts
  const { count: functionalItems } = await supabase
    .from("item")
    .select("*", { count: "exact", head: true })
    .eq("type", "functional");

  const { count: decorativeItems } = await supabase
    .from("item")
    .select("*", { count: "exact", head: true })
    .eq("type", "decorative");

  const { count: terrainItems } = await supabase
    .from("item")
    .select("*", { count: "exact", head: true })
    .eq("type", "terrain");

  // Knowledge-base Moderation counts
  const { count: pendingKnowledge } = await supabase
    .from("knowledge_base")
    .select("*", { count: "exact", head: true })
    .gte("accuracy", 0.55)
    .lte("accuracy", 0.59);

  const { count: declinedKnowledge } = await supabase
    .from("knowledge_base")
    .select("*", { count: "exact", head: true })
    .lte("accuracy", 0.54);

  const { count: verifiedKnowledge } = await supabase
    .from("knowledge_base")
    .select("*", { count: "exact", head: true })
    .gte("accuracy", 0.60);

  // User Management counts
  const { count: adminUsers } = await supabase
    .from("profile")
    .select("*", { count: "exact", head: true })
    .eq("type", "admin");

  const { count: islandUsers } = await supabase
    .from("profile")
    .select("*", { count: "exact", head: true })
    .eq("type", "island");

  const { count: nonIslandUsers } = await supabase
    .from("profile")
    .select("*", { count: "exact", head: true })
    .eq("type", "non-island");

  const stats = {
    shop: {
      functional: functionalItems || 0,
      decorative: decorativeItems || 0,
      terrain: terrainItems || 0,
    },
    knowledge: {
      pending: pendingKnowledge || 0,
      declined: declinedKnowledge || 0,
      verified: verifiedKnowledge || 0,
    },
    users: {
      admin: adminUsers || 0,
      island: islandUsers || 0,
      nonIsland: nonIslandUsers || 0,
    },
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <DashboardHeader username={profile.name || "Admin"} />
      <DashboardCards stats={stats} />
    </div>
  );
}