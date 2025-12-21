import { requireAdmin } from "@/lib/auth/session";
import { getIslandItems } from "@/actions/knowledge";
import AdminHeader from "@/features/header/AdminHeader";
import KnowledgeManagement from "@/features/knowledge/KnowledgeManagement";
import { createClient } from "@/lib/supabase/server";

export default async function KnowledgePage() {
  const { profile } = await requireAdmin();
  const items = await getIslandItems();
  const supabase = await createClient();

  // Fetch stats
  const { count: totalItems } = await supabase
    .from("island-item")
    .select("*", { count: "exact", head: true });

  const { count: verifiedItems } = await supabase
    .from("island-item")
    .select("*", { count: "exact", head: true })
    .eq("status", "verified");

  const { count: pendingItems } = await supabase
    .from("island-item")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: declinedItems } = await supabase
    .from("island-item")
    .select("*", { count: "exact", head: true })
    .eq("status", "declined");

  const { count: unverifiedItems } = await supabase
    .from("island-item")
    .select("*", { count: "exact", head: true })
    .eq("status", "unverified");

  const stats = {
    total: totalItems || 0,
    verified: verifiedItems || 0,
    pending: pendingItems || 0,
    declined: declinedItems || 0,
    unverified: unverifiedItems || 0,
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <AdminHeader username={profile.name || "Admin"} />
      <KnowledgeManagement items={items} stats={stats} />
    </div>
  );
}
