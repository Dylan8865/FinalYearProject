import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // 1. Verify ownership of the item-data (via island-item and profile_id)
    const { data: itemData, error: fetchError } = await supabase
      .from("item-data")
      .select(
        `
        id,
        island_item_id,
        "island-item" (profile_id)
      `
      )
      .eq("id", id)
      .single();

    if (fetchError || !itemData) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const profileId = (itemData as any)["island-item"]?.profile_id;
    if (profileId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Get the file from request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 3. Upload to storage using admin client (bypasses RLS)
    // We use the item-data ID as the filename
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("item-data")
      .upload(id, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 4. Get public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("item-data").getPublicUrl(id);

    // Add cache busting timestamp
    const finalUrl = `${publicUrl}?t=${Date.now()}`;

    // 5. Update the content field in the database
    const { error: updateError } = await adminClient
      .from("item-data")
      .update({ content: finalUrl })
      .eq("id", id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ publicUrl: finalUrl });
  } catch (error) {
    console.error("Unexpected error during item image upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // 1. Verify ownership
    const { data: itemData, error: fetchError } = await supabase
      .from("item-data")
      .select(
        `
        id,
        island_item_id,
        "island-item" (profile_id)
      `
      )
      .eq("id", id)
      .single();

    if (fetchError || !itemData) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const profileId = (itemData as any)["island-item"]?.profile_id;
    if (profileId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Delete from storage using admin client
    const { error: deleteError } = await adminClient.storage
      .from("item-data")
      .remove([id]);

    if (deleteError) {
      console.error("Storage delete error:", deleteError);
    }

    // 3. Update record
    const { error: updateError } = await adminClient
      .from("item-data")
      .update({ content: "" })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error during item image removal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
