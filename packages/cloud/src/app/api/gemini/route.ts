import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query, type = "suggestions" } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    let prompt = "";

    switch (type) {
      case "suggestions":
        prompt = `Given the search query "${query}", suggest 5 related educational topics that a student might be interested in. Return only the topic names separated by commas, nothing else.`;
        break;
      case "explain":
        prompt = `Explain the topic "${query}" in simple terms for a student. Keep it under 100 words.`;
        break;
      case "related":
        prompt = `List 5 topics closely related to "${query}" for further learning. Return only the topic names separated by commas, nothing else.`;
        break;
      default:
        prompt = query;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Gemini API request failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse response based on type
    if (type === "suggestions" || type === "related") {
      const suggestions = text
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      return NextResponse.json({ suggestions });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
