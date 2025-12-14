import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardHeader from "@/features/dashboard/DashboardHeader";
import DashboardCards from "@/features/dashboard/DashboardCards";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Step 1: Check if user is authenticated (use getUser() instead of getSession())
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Step 2: Check if user is admin
  const { data: profile } = await supabase
    .from("profile")
    .select("type, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.type !== "admin") {
    await supabase.auth.signOut();
    redirect("/login?error=not_admin");
  }

  // Step 3: Fetch stats from database
  // Shop Management counts
  const { count: functionalItems } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("type", "functional");

  const { count: decorativeItems } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("type", "decorative");

  const { count: terrainItems } = await supabase
    .from("items")
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
    .eq("type", "user");

  const { count: totalUsers } = await supabase
    .from("profile")
    .select("*", { count: "exact", head: true });

  const nonIslandUsers = (totalUsers || 0) - (islandUsers || 0) - (adminUsers || 0);

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