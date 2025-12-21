"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Increment search count when a topic is searched
 * This makes the word bigger in the cloud
 */
export async function incrementSearchCount(topicId: string) {
  try {
    const supabase = await createClient();

    // Get current search count
    const { data: topic, error: fetchError } = await supabase
      .from("cloud_topics")
      .select("weight")
      .eq("id", topicId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch topic:", fetchError);
      return { success: false, error: fetchError.message };
    }

    // Increment weight (search count affects word size)
    const newWeight = Math.min((topic?.weight || 50) + 1, 100);

    const { error: updateError } = await supabase
      .from("cloud_topics")
      .update({ weight: newWeight, updated_at: new Date().toISOString() })
      .eq("id", topicId);

    if (updateError) {
      console.error("Failed to update topic:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/");
    return { success: true, newWeight };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Toggle favourite status for a topic
 */
export async function toggleFavouriteTopic(topicId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if already favourited
    const { data: existing } = await supabase
      .from("user_favourite_topic")
      .select("id")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .single();

    if (existing) {
      // Remove favourite
      const { error } = await supabase
        .from("user_favourite_topic")
        .delete()
        .eq("id", existing.id);

      if (error) {
        return { success: false, error: error.message };
      }
      revalidatePath("/");
      return { success: true, favourited: false };
    } else {
      // Add favourite
      const { error } = await supabase.from("user_favourite_topic").insert({
        user_id: user.id,
        topic_id: topicId,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      revalidatePath("/");
      return { success: true, favourited: true };
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Search topics using Gemini AI for intelligent suggestions
 */
export async function searchWithGemini(query: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return { success: false, error: "AI search not configured" };
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
              parts: [
                {
                  text: `Given the search query "${query}", suggest 5 related educational topics that a student might be interested in. Return only the topic names separated by commas, nothing else.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Gemini API request failed");
    }

    const data = await response.json();
    const suggestions =
      data.candidates?.[0]?.content?.parts?.[0]?.text
        ?.split(",")
        .map((s: string) => s.trim()) || [];

    return { success: true, suggestions };
  } catch (error) {
    console.error("Gemini search error:", error);
    return { success: false, error: "AI search failed" };
  }
}
