import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import AdminHeader from "@/features/header/AdminHeader";
import ShopManagement from "@/features/shop/ShopManagement";

export default async function ShopPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  // Fetch all items
  const { data: items, error: itemsError } = await supabase
    .from("item")
    .select("id, name, type, mana_required, mana_rate, image_cover_path")
    .order("name", { ascending: true });

  // Error is handled by returning empty array to items || []

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <AdminHeader username={profile.name || "Admin"} />
      <ShopManagement items={items || []} />
    </div>
  );
}