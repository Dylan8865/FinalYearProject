import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import AdminHeader from "@/features/header/AdminHeader";
import ValidationLogs from "@/features/knowledge/ValidationLogs";

export default async function ValidationLogsPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  // Fetch validation logs with related island-item and profile information
  const { data: validationLogs, error: logsError } = await supabase
    .from("validation-log")
    .select(
      `
      id,
      created_at,
      status,
      error,
      retry_count,
      request,
      response,
      island_item:item_id (
        id,
        title,
        profile:profile_id!inner (
          id,
          name,
          email
        )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  // Transform the data to ensure proper structure
  const transformedLogs = validationLogs?.map((log: any) => ({
    ...log,
    island_item: log.island_item ? {
      id: log.island_item.id,
      title: log.island_item.title,
      profile: Array.isArray(log.island_item.profile) ? log.island_item.profile[0] : log.island_item.profile
    } : null
  })) || [];

  if (logsError) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching validation logs:", logsError);
    }
  }

  // Calculate statistics
  const stats = {
    total: transformedLogs.length,
    completed: transformedLogs.filter((log) => log.status === "completed").length,
    pending: transformedLogs.filter((log) => log.status === "pending").length,
    failed: transformedLogs.filter((log) => log.status === "error").length,
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <AdminHeader username={profile.name || "Admin"} />
      <ValidationLogs logs={transformedLogs} stats={stats} />
    </div>
  );
}
