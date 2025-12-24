"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

interface IslandItem {
  id: string;
  created_at: string;
  title: string | null;
  image_cover_path: string | null;
  level: number | null;
  grid_x: number | null;
  grid_y: number | null;
  grid_z: number | null;
  island_id: string | null;
  item_id: string | null;
  pos_x: number | null;
  pos_y: number | null;
  profile_id: string | null;
  status: string | null;
  validity: number | null;
  comment: string | null;
  validation_status: string | null;
  admin_comment: string | null;
  profile?: {
    name: string | null;
    email: string | null;
  };
}

interface ItemData {
  id: string;
  created_at: string;
  type: string | null;
  content: any;
  island_item_id: string | null;
  order_index: number | null;
  parent_id: string | null;
  properties: any;
  validity: number | null;
}

// Helper to create service role client that bypasses RLS
function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getIslandItems() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("island-item")
    .select(`
      *,
      profile:profile_id (
        name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch island items: ${error.message}`);
  }

  return data as IslandItem[];
}

export async function getIslandItemById(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("island-item")
    .select(`
      *,
      profile:profile_id (
        name,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch island item: ${error.message}`);
  }

  return data as IslandItem;
}

export async function getItemDataByIslandItemId(islandItemId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("item-data")
    .select("*")
    .eq("island_item_id", islandItemId)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch item data: ${error.message}`);
  }

  return (data || []) as ItemData[];
}

export async function updateIslandItemStatus(
  id: string,
  status: "verified" | "declined" | "pending",
  adminComment?: string
) {
  await requireAdmin();

  if (!id || typeof id !== "string" || id.trim().length === 0) {
    throw new Error("Invalid island item ID");
  }

  // Validate status
  const validStatuses = ["verified", "declined", "pending"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status value");
  }

  // Sanitize and validate admin comment
  if (adminComment !== undefined) {
    if (typeof adminComment !== "string") {
      throw new Error("Admin comment must be a string");
    }
    // Trim whitespace
    adminComment = adminComment.trim();
    // Check max length (prevent excessive data)
    if (adminComment.length > 5000) {
      throw new Error("Admin comment is too long (max 5000 characters)");
    }
  }

  const supabase = await createClient();

  // Check if item exists
  const { data: existingItem, error: fetchError } = await supabase
    .from("island-item")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existingItem) {
    throw new Error("Island item not found");
  }

  const updateData: any = {
    status,
    validation_status: status === "pending" ? "pending" : "completed",
  };

  if (adminComment !== undefined) {
    updateData.admin_comment = adminComment;
  }

  const { error } = await supabase
    .from("island-item")
    .update(updateData)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update island item status: ${error.message}`);
  }

  revalidatePath("/knowledge");
  return { success: true };
}

export async function getValidationLogs() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("validation-log")
    .select(`
      *,
      island_item:item_id (
        id,
        title,
        profile_id,
        profile:profile_id (
          name,
          email
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch validation logs: ${error.message}`);
  }

  return data || [];
}

export async function getValidationStats() {
  await requireAdmin();
  const supabase = createAdminClient();

  // Get total validation requests
  const { count: totalRequests, error: totalError } = await supabase
    .from("validation-log")
    .select("*", { count: "exact", head: true });

  // Get successful validations
  const { count: successfulValidations, error: successError } = await supabase
    .from("validation-log")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  // Get failed validations
  const { count: failedValidations, error: failedError } = await supabase
    .from("validation-log")
    .select("*", { count: "exact", head: true })
    .eq("status", "error");

  // Get pending validations
  const { count: pendingValidations, error: pendingError } = await supabase
    .from("validation-log")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Get validations by day (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentLogs } = await supabase
    .from("validation-log")
    .select("created_at, status")
    .gte("created_at", sevenDaysAgo.toISOString());

  // Group by day
  const validationsByDay: { [key: string]: number } = {};
  recentLogs?.forEach((log) => {
    const date = new Date(log.created_at).toLocaleDateString();
    validationsByDay[date] = (validationsByDay[date] || 0) + 1;
  });

  // Get top users by validation requests
  const { data: userValidations } = await supabase
    .from("validation-log")
    .select(`
      island_item:item_id (
        profile_id,
        profile:profile_id (
          name,
          email
        )
      )
    `);

  const userRequestCounts: { [key: string]: { name: string; count: number } } =
    {};
  userValidations?.forEach((log: any) => {
    if (log.island_item?.profile) {
      const userId = log.island_item.profile_id;
      const userName = log.island_item.profile.name || "Unknown";
      if (!userRequestCounts[userId]) {
        userRequestCounts[userId] = { name: userName, count: 0 };
      }
      userRequestCounts[userId].count++;
    }
  });

  const topUsers = Object.entries(userRequestCounts)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalRequests: totalRequests || 0,
    successfulValidations: successfulValidations || 0,
    failedValidations: failedValidations || 0,
    pendingValidations: pendingValidations || 0,
    validationsByDay,
    topUsers,
  };
}
