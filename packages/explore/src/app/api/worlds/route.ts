import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "all";
  const sort = searchParams.get("sort") ?? "newest";

  const supabase = await createClient();

  let query = supabase
    .from("worlds")
    .select("id, title, description, category, created_at");

  // Search
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  // Category filter
  if (category !== "all") {
    query = query.eq("category", category);
  }

  // Sort
  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "az") {
    query = query.order("title", { ascending: true });
  } else if (sort === "za") {
    query = query.order("title", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
