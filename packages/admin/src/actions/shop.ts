"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const MAX_MANA_VALUE = 9999999;
const MAX_MANA_RATE = 999;

interface UpdateItemData {
  name: string;
  type: string;
  mana_required: number;
  mana_rate: number;
}

export async function updateItem(itemId: string, data: UpdateItemData) {
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
  if (!itemId || typeof itemId !== "string" || itemId.trim().length === 0) {
    throw new Error("Invalid item ID");
  }

  // Validate name
  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    throw new Error("Item name is required");
  }
  const sanitizedName = data.name.trim();
  if (sanitizedName.length > 200) {
    throw new Error("Item name is too long (max 200 characters)");
  }

  // Validate type
  const validTypes = ["functional", "decorative", "terrain"];
  if (!validTypes.includes(data.type)) {
    throw new Error("Invalid item type");
  }

  // Validate mana_required
  if (typeof data.mana_required !== "number" || data.mana_required < 0 || !Number.isInteger(data.mana_required)) {
    throw new Error("Mana required must be a non-negative integer");
  }
  if (data.mana_required > MAX_MANA_VALUE) {
    throw new Error(`Mana required value is too large (max ${MAX_MANA_VALUE.toLocaleString()})`);
  }

  // Validate mana_rate
  if (typeof data.mana_rate !== "number" || data.mana_rate < 0 || !Number.isInteger(data.mana_rate)) {
    throw new Error("Mana rate must be a non-negative integer");
  }
  if (data.mana_rate > MAX_MANA_RATE) {
    throw new Error(`Mana rate value is too large (max ${MAX_MANA_RATE.toLocaleString()})`);
  }

  // Check if item exists
  const { data: existingItem, error: fetchError } = await supabase
    .from("item")
    .select("id")
    .eq("id", itemId)
    .single();

  if (fetchError || !existingItem) {
    throw new Error("Item not found");
  }

  // Update item
  const { error } = await supabase
    .from("item")
    .update({
      name: sanitizedName,
      type: data.type,
      mana_required: data.mana_required,
      mana_rate: data.mana_rate,
    })
    .eq("id", itemId);

  if (error) throw new Error(`Failed to update item: ${error.message}`);

  revalidatePath("/shop");
}

export async function uploadItemImage(itemId: string, file: File) {
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

  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    throw new Error("File size exceeds 50MB limit");
  }

  // Get file extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) {
    throw new Error("Invalid file type. Only PNG, JPG, JPEG, GIF, and WEBP are allowed");
  }

  // Generate filename as itemId.extension
  const filename = `${itemId}.${extension}`;

  // Use service role client for storage operations (bypasses RLS)
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete existing images with this itemId (any extension)
  const { data: existingFiles } = await adminClient.storage
    .from("items")
    .list("", {
      search: itemId,
    });

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles
      .filter((f) => f.name.startsWith(itemId + "."))
      .map((f) => f.name);
    
    if (filesToDelete.length > 0) {
      await adminClient.storage.from("items").remove(filesToDelete);
    }
  }

  // Upload new file
  const { error: uploadError } = await adminClient.storage
    .from("items")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Update item's image_cover_path
  const { error: updateError } = await supabase
    .from("item")
    .update({
      image_cover_path: filename,
    })
    .eq("id", itemId);

  if (updateError) {
    throw new Error(`Failed to update item image path: ${updateError.message}`);
  }

  revalidatePath("/shop");
  
  return filename;
}

export async function removeItemImage(itemId: string) {
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

  // Use service role client for storage operations (bypasses RLS)
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete existing images with this itemId (any extension)
  const { data: existingFiles } = await adminClient.storage
    .from("items")
    .list("", {
      search: itemId,
    });

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles
      .filter((f) => f.name.startsWith(itemId + "."))
      .map((f) => f.name);
    
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await adminClient.storage.from("items").remove(filesToDelete);
      if (deleteError) {
        throw new Error(`Failed to delete image: ${deleteError.message}`);
      }
    }
  }

  // Update item's image_cover_path to null
  const { error: updateError } = await supabase
    .from("item")
    .update({
      image_cover_path: null,
    })
    .eq("id", itemId);

  if (updateError) {
    throw new Error(`Failed to update item image path: ${updateError.message}`);
  }

  revalidatePath("/shop");
}

export async function getItemImageUrl(imagePath: string | null) {
  if (!imagePath) return null;

  const supabase = await createClient();
  
  const { data } = supabase.storage
    .from("items")
    .getPublicUrl(imagePath);

  return data.publicUrl;
}
