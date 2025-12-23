import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import AdminHeader from "@/features/header/AdminHeader";
import UserManagement from "@/features/user/UserManagement";

export default async function UserPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const { data: users, error: usersError } = await supabase
    .from("profile")
    .select("id, name, email, created_at, last_login_time, mana, level, type")
    .order("created_at", { ascending: false });

  // Error is handled by returning empty array to users || []

  // Fetch stats
  const { count: totalUsers } = await supabase
    .from("profile")
    .select("*", { count: "exact", head: true });

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
    total: totalUsers || 0,
    admin: adminUsers || 0,
    island: islandUsers || 0,
    nonIsland: nonIslandUsers || 0,
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <AdminHeader username={profile.name || "Admin"} />
      <UserManagement users={users || []} stats={stats} />
    </div>
  );
}