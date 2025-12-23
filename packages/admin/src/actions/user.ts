"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const MAX_MANA = 999999999;
const MAX_LEVEL = 32767;

interface UpdateUserData {
  name: string;
  mana: number;
  level: number;
  type: string;
}

export async function updateUser(userId: string, data: UpdateUserData) {
  const supabase = await createClient();

  // Verify admin privileges
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profile")
    .select("type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.type !== "admin") {
    throw new Error("Not authorized");
  }

  // Input validation and sanitization
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("Invalid user ID");
  }

  // Validate name
  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    throw new Error("Username is required");
  }
  
  // Sanitize name (trim and limit length)
  const sanitizedName = data.name.trim();
  if (sanitizedName.length > 100) {
    throw new Error("Username is too long (max 100 characters)");
  }

  // Validate mana
  if (typeof data.mana !== "number" || data.mana < 0 || !Number.isInteger(data.mana)) {
    throw new Error("Mana must be a non-negative integer");
  }
  if (data.mana > MAX_MANA) {
    throw new Error(`Mana value is too large (max ${MAX_MANA.toLocaleString()})`);
  }

  // Validate level
  if (typeof data.level !== "number" || data.level < 0 || !Number.isInteger(data.level)) {
    throw new Error("Level must be a non-negative integer");
  }
  if (data.level > MAX_LEVEL) {
    throw new Error(`Level value is too large (max ${MAX_LEVEL.toLocaleString()})`);
  }

  // Validate type
  const validTypes = ["admin", "island", "non-island"];
  if (!validTypes.includes(data.type)) {
    throw new Error("Invalid user type");
  }

  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from("profile")
    .select("id")
    .eq("id", userId)
    .single();

  if (fetchError || !existingUser) {
    throw new Error("User not found");
  }

  // Update user
  const { error } = await supabase
    .from("profile")
    .update({
      name: sanitizedName,
      mana: data.mana,
      level: data.level,
      type: data.type,
    })
    .eq("id", userId);

  if (error) throw new Error(`Failed to update user: ${error.message}`);

  revalidatePath("/user");
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();

  // Verify admin privileges
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profile")
    .select("type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.type !== "admin") {
    throw new Error("Not authorized");
  }

  // Input validation
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("Invalid user ID");
  }

  // Prevent self-deletion
  if (user.id === userId) {
    throw new Error("Cannot delete your own account");
  }

  // Check if user exists
  const { data: targetUser, error: fetchError } = await supabase
    .from("profile")
    .select("id, type")
    .eq("id", userId)
    .single();

  if (fetchError || !targetUser) {
    throw new Error("User not found");
  }

  // Prevent deleting other admins
  if (targetUser.type === "admin") {
    throw new Error("Cannot delete admin accounts");
  }

  // Delete profile - everything else cascades automatically:
  // - chat (CASCADE) → feedback (CASCADE from chat)
  // - favourite (CASCADE)
  // - island (CASCADE)
  // - island-item (CASCADE) → item-data (CASCADE) → cloud-topics-cache (CASCADE)
  // - knowledge-graph-favorites (CASCADE)
  // 
  // Preserved logs (via ON DELETE SET NULL):
  // - search-history: chat_id set to null, records preserved
  // - validation-log: item_id set to null, records preserved
  const { error: profileError } = await supabase
    .from("profile")
    .delete()
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Failed to delete user profile: ${profileError.message}`);
  }

  // Delete from auth.users using service role key
  try {
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (authError) {
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }
  } catch (authError: any) {
    throw new Error(`Failed to delete auth user: ${authError.message || authError}`);
  }

  revalidatePath("/user");
}

export async function resetUser(userId: string) {
  // Use service role client for admin operations
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify admin privileges using regular client
  const regularClient = await createClient();
  const { data: { user } } = await regularClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await regularClient
    .from("profile")
    .select("type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.type !== "admin") {
    throw new Error("Not authorized");
  }

  // Input validation
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("Invalid user ID");
  }

  // Prevent self-reset
  if (user.id === userId) {
    throw new Error("Cannot reset your own account");
  }

  // Check if user exists
  const { data: targetUser, error: fetchError } = await supabase
    .from("profile")
    .select("id, type")
    .eq("id", userId)
    .single();

  if (fetchError || !targetUser) {
    throw new Error("User not found");
  }

  // Prevent resetting admin accounts
  if (targetUser.type === "admin") {
    throw new Error("Cannot reset admin accounts");
  }

  // Delete user data while preserving logs (search-history, validation-log)
  // Keep islands to prevent account bricking with 0 mana
  
  // 1. Delete island-item (will CASCADE to item-data and cloud-topics-cache)
  // Note: validation-log has ON DELETE SET NULL, so logs are preserved
  const { error: islandItemError } = await supabase
    .from("island-item")
    .delete()
    .eq("profile_id", userId);
  
  if (islandItemError) {
    throw new Error(`Failed to delete island items: ${islandItemError.message}`);
  }

  // 2. Delete knowledge-graph-favorites
  const { error: knowledgeGraphError } = await supabase
    .from("knowledge-graph-favorites")
    .delete()
    .eq("user_id", userId);
  
  if (knowledgeGraphError) {
    throw new Error(`Failed to delete knowledge graph favorites: ${knowledgeGraphError.message}`);
  }

  // 3. Delete favourite
  const { error: favouriteError } = await supabase
    .from("favourite")
    .delete()
    .eq("profile_id", userId);
  
  if (favouriteError) {
    throw new Error(`Failed to delete favourites: ${favouriteError.message}`);
  }

  // 4. Delete chat (will CASCADE to feedback)
  // Note: search-history has ON DELETE SET NULL on chat_id, so history logs are preserved
  const { error: chatError } = await supabase
    .from("chat")
    .delete()
    .eq("profile_id", userId);
  
  if (chatError) {
    throw new Error(`Failed to delete chats: ${chatError.message}`);
  }

  // 5. Reset profile data (keeping account but clearing progress)
  const { error: profileError } = await supabase
    .from("profile")
    .update({
      mana: 0,
      level: 0,
      last_login_time: null,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Failed to reset user profile: ${profileError.message}`);
  }

  revalidatePath("/user");
}

