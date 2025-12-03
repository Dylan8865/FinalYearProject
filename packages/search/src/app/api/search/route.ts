import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  // TODO: Implement search logic
  return NextResponse.json({ query, results: [] });
}

export async function POST(request: Request) {
  const body = await request.json();

  // TODO: Implement search logic
  return NextResponse.json({ results: [] });
}
