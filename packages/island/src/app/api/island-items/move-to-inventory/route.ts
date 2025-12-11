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

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in POST /api/island-items/move-to-inventory:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
