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

    const { data, error } = await supabase
      .from("search_index")
      .select("id, title, content, metadata, updated_at") // ✅ 只加这一项
      .ilike("title", `%${q}%`)
      .limit(20);

    if (error) {
      console.error("Supabase search error:", error);
      return NextResponse.json({ data: [] }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Search API crashed:", err);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
