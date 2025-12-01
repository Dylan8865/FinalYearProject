import { NextResponse } from "next/server";

const MOCK: Array<{ title: string; snippet: string; url?: string }> = [
  { title: "Wisdom Island - Home", snippet: "Explore communities and worlds on Wisdom Island.", url: "/world/1" },
  { title: "How to join a world", snippet: "Step-by-step guide to joining a world on Wisdom Island.", url: "/world/join" },
  { title: "Profile settings", snippet: "Manage your profile and preferences.", url: "/profile" },
  { title: "Search tips", snippet: "Use natural language queries for better results." },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const q = (body.q || "").toString().toLowerCase();

    const results = MOCK.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) || item.snippet.toLowerCase().includes(q) || (item.url || "").toLowerCase().includes(q)
      );
    });

    // Return a small set to simulate search ranking
    return NextResponse.json({ results: results.slice(0, 5) });
  } catch (err) {
    return NextResponse.json({ results: [], error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  // simple ping / discover
  return NextResponse.json({ message: "Search API ready" });
}
