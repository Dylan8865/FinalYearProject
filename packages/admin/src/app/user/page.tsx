import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import AdminHeader from "@/features/header/AdminHeader";
import UserManagement from "@/features/user/UserManagement";

export default async function UserPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  // Fetch all users
  const { data: users, error: usersError } = await supabase
    .from("profile")
    .select("id, name, email, created_at, last_login_time, mana, level, type")
    .order("created_at", { ascending: false });

  if (usersError) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching users:", usersError);
    }
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <AdminHeader username={profile.name || "Admin"} />
      <UserManagement users={users || []} />
    </div>
  );
}