import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { getValidationLogs, getValidationStats } from "@/actions/knowledge";
import ValidationLogDashboard from "@/features/knowledge/ValidationLogDashboard";
import DashboardHeader from "@/features/header/AdminHeader";

export default async function ValidationLogPage() {
  const { user, profile } = await requireAdmin();

  const logs = await getValidationLogs();
  const stats = await getValidationStats();

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <DashboardHeader username={profile.name || "Admin"} />
      <ValidationLogDashboard logs={logs} stats={stats} />
    </div>
  );
}
