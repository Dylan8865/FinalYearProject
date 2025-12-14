import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Remove Item from Island API
 * 
 * Moves an item from the island back to inventory by:
 * 1. Clearing island placement data (island_id, grid_x, grid_y, grid_z)
 * 2. Setting inventory position (pos_x, pos_y)
 * 3. If user has same item type in inventory, use that position (for stacking)
 * 4. Otherwise, find next available inventory slot
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { id, profile_id, item_id } = body;

        if (!id || !profile_id || !item_id) {
            return NextResponse.json(
                { error: "id, profile_id, and item_id are required" },
                { status: 400 }
            );
        }

        // Always find next available inventory slot (no stacking)
        const { data: allInventoryPositions, error: posError } = await supabase
            .from("island-item")
            .select("pos_x, pos_y")
            .eq("profile_id", profile_id);

        if (posError) {
            console.error("Error fetching inventory positions:", posError);
            return NextResponse.json(
                { error: "Failed to fetch inventory positions" },
                { status: 500 }
            );
        }

        // Find next available slot
        const used = new Set(allInventoryPositions.map((p) => `${p.pos_x},${p.pos_y}`));
        let targetPos = { pos_x: 0, pos_y: 0 };
        let found = false;

        for (let y = 0; y < 5 && !found; y++) {
            for (let x = 0; x < 10 && !found; x++) {
                if (!used.has(`${x},${y}`)) {
                    targetPos = { pos_x: x, pos_y: y };
                    found = true;
                }
            }
        }

        console.log(`Returning item to new inventory position:`, targetPos);

        // Update the item: clear island data, set inventory position
        const { data: updatedItem, error: updateError } = await supabase
            .from("island-item")
            .update({
                island_id: null,
                grid_x: null,
                grid_y: null,
                grid_z: null,
                pos_x: targetPos.pos_x,
                pos_y: targetPos.pos_y,
            })
            .eq("id", id)
            .select("*, item(*), island(*)")
            .single();

        if (updateError) {
            console.error("Error removing item from island:", updateError);
            return NextResponse.json(
                { error: "Failed to remove item from island" },
                { status: 500 }
            );
        }

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
