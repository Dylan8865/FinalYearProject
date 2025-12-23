import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ data: [] });
    }

    // Fallback: Query the 'island' table directly if 'search_index' doesn't work or as the primary source
    // The user mentioned the database changes broke the link, so we trust the 'island' table.
    const { data, error } = await supabase
      .from("island")
      .select("id, name, description")
      .ilike("name", `%${q}%`)
      .limit(20);

    if (error) {
      console.error("Supabase search error:", error);
      return NextResponse.json({ data: [] }, { status: 500 });
    }

    // Map the island data to the expected search result format
    const formattedData = data.map((island: any) => ({
      id: island.id,
      title: island.name,
      content: island.description,
      // We can add metadata if needed, but for now strict mapping is enough
    }));

    return NextResponse.json({ data: formattedData });
  } catch (err) {
    console.error("Search API crashed:", err);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
