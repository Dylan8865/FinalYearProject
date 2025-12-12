import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * API Route: Move Item to Inventory
 * 
 * Moves an item from the island grid back to the inventory by:
 * - Clearing island_id, grid_x, grid_y, grid_z
 * - Setting pos_x and pos_y to the target inventory slot
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { id, pos_x, pos_y } = body;

        if (!id || pos_x === undefined || pos_y === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: id, pos_x, pos_y" },
                { status: 400 }
            );
        }

        // Update the island-item to move it to inventory
        // Clear grid coordinates and island_id, set inventory position
        const { data, error } = await supabase
            .from("island-item")
            .update({
                island_id: null,
                grid_x: null,
                grid_y: null,
                grid_z: null,
                pos_x,
                pos_y,
            })
            .eq("id", id)
            .select("*, item(*), island(*)")
            .single();

        if (error) {
            console.error("Error moving item to inventory:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Resolve image and model URLs from storage paths
        if (data && data.item) {
            let imageCoverUrl = null;
            let modelUrl = null;

            // Get public URL for cover image if path exists
            if (data.item.image_cover_path) {
                const { data: imageData } = supabase.storage
                    .from("items")
                    .getPublicUrl(data.item.image_cover_path);
                imageCoverUrl = imageData?.publicUrl || null;
            }

            // Get public URL for 3D model if path exists
            if (data.item.model_path) {
                const { data: modelData } = supabase.storage
                    .from("items")
                    .getPublicUrl(data.item.model_path);
                modelUrl = modelData?.publicUrl || null;
            }

            // Add resolved URLs to item
            data.item.image_cover_url = imageCoverUrl;
            data.item.model_url = modelUrl;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in POST /api/island-items/move-to-inventory:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
