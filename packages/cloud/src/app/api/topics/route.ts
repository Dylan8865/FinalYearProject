import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: topics, error } = await supabase
      .from("cloud_topics")
      .select("*")
      .order("weight", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch topics" },
        { status: 500 }
      );
    }

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: topic, error } = await supabase
      .from("cloud_topics")
      .insert({
        text: body.text,
        weight: body.weight || 50,
        category: body.category || null,
        trending: body.trending || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create topic" },
        { status: 500 }
      );
    }

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Topic ID is required" },
        { status: 400 }
      );
    }

    const { data: topic, error } = await supabase
      .from("cloud_topics")
      .update({
        text: body.text,
        weight: body.weight,
        category: body.category,
        trending: body.trending,
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update topic" },
        { status: 500 }
      );
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Topic ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("cloud_topics").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete topic" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
