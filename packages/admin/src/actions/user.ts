"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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
  if (data.mana > 999999999) {
    throw new Error("Mana value is too large (max 999,999,999)");
  }

  // Validate level
  if (typeof data.level !== "number" || data.level < 0 || !Number.isInteger(data.level)) {
    throw new Error("Level must be a non-negative integer");
  }
  if (data.level > 32767) {
    throw new Error("Level value is too large (max 32,767)");
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

  // Prevent deleting other admins (optional safety check)
  if (targetUser.type === "admin") {
    throw new Error("Cannot delete admin accounts");
  }

  // Delete all related data in correct order (respecting foreign keys)
  
  // 1. Delete item-data (depends on island-item)
  const { data: islandItems } = await supabase
    .from("island-item")
    .select("id")
    .eq("profile_id", userId);

  if (islandItems && islandItems.length > 0) {
    const islandItemIds = islandItems.map((item) => item.id);
    await supabase.from("item-data").delete().in("island_item_id", islandItemIds);
  }

  // 2. Delete search-history (depends on chat)
  const { data: chats } = await supabase
    .from("chat")
    .select("id")
    .eq("profile_id", userId);

  if (chats && chats.length > 0) {
    const chatIds = chats.map((chat) => chat.id);
    await supabase.from("search-history").delete().in("chat_id", chatIds);
  }

  // 3. Delete island-item (depends on island)
  await supabase.from("island-item").delete().eq("profile_id", userId);

  // 4. Delete island (depends on profile)
  await supabase.from("island").delete().eq("profile_id", userId);

  // 5. Delete favourite (depends on profile)
  await supabase.from("favourite").delete().eq("profile_id", userId);

  // 6. Delete chat (depends on profile)
  await supabase.from("chat").delete().eq("profile_id", userId);

  // 7. Delete profile
  const { error: profileError } = await supabase
    .from("profile")
    .delete()
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Failed to delete user profile: ${profileError.message}`);
  }

  // 8. Delete from auth.users using service role key
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

  // Delete all user-related data in correct order (respecting foreign keys)
  
  // 1. Delete item-data (depends on island-item)
  const { data: deleteIslandItems } = await supabase
    .from("island-item")
    .select("id")
    .eq("profile_id", userId);

  if (deleteIslandItems && deleteIslandItems.length > 0) {
    const islandItemIds = deleteIslandItems.map((item) => item.id);
    const { error: itemDataError } = await supabase
      .from("item-data")
      .delete()
      .in("island_item_id", islandItemIds);
    
    if (itemDataError) {
      throw new Error(`Failed to delete item data: ${itemDataError.message}`);
    }
  }

  // 2. Delete search-history (depends on chat)
  const { data: deleteChats } = await supabase
    .from("chat")
    .select("id")
    .eq("profile_id", userId);

  if (deleteChats && deleteChats.length > 0) {
    const chatIds = deleteChats.map((chat) => chat.id);
    const { error: searchHistoryError } = await supabase
      .from("search-history")
      .delete()
      .in("chat_id", chatIds);
    
    if (searchHistoryError) {
      throw new Error(`Failed to delete search history: ${searchHistoryError.message}`);
    }
  }

  // 3. Delete island-item (depends on island)
  const { error: islandItemError } = await supabase
    .from("island-item")
    .delete()
    .eq("profile_id", userId);
  
  if (islandItemError) {
    throw new Error(`Failed to delete island items: ${islandItemError.message}`);
  }

  // 4. Delete island (depends on profile)
  const { error: islandError } = await supabase
    .from("island")
    .delete()
    .eq("profile_id", userId);
  
  if (islandError) {
    throw new Error(`Failed to delete islands: ${islandError.message}`);
  }

  // 5. Delete favourite (depends on profile)
  const { error: favouriteError } = await supabase
    .from("favourite")
    .delete()
    .eq("profile_id", userId);
  
  if (favouriteError) {
    throw new Error(`Failed to delete favourites: ${favouriteError.message}`);
  }

  // 6. Delete chat (depends on profile)
  const { error: chatError } = await supabase
    .from("chat")
    .delete()
    .eq("profile_id", userId);
  
  if (chatError) {
    throw new Error(`Failed to delete chats: ${chatError.message}`);
  }

  // 7. Reset profile data (keeping account but clearing progress)
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

