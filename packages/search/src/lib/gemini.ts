// Google Gemini AI Service
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
  }[];
  error?: {
    message: string;
  };
}

interface GenerateAnswerOptions {
  query: string;
  context?: string;
  systemPrompt?: string;
}

// Generate an AI response using Gemini
export async function generateAnswer({ query, context, systemPrompt }: GenerateAnswerOptions): Promise<string> {
  if (!GEMINI_API_KEY) {
    // Skip AI if no key - will use fallback response
    return "";
  }

  const defaultSystemPrompt = `You are a helpful AI assistant for Wisdom Search, a knowledge sharing platform. 
Your role is to help users find and understand information from the knowledge repository.
Be conversational, helpful, and accurate. If you don't have enough information, say so honestly.
Format your responses with clear structure using markdown (bold, bullet points, etc.).`;

  const fullPrompt = context 
    ? `${systemPrompt || defaultSystemPrompt}

Based on the following knowledge from our repository:
${context}

User question: ${query}

Please provide a helpful, conversational response that synthesizes the information above. Include relevant details and cite the sources when appropriate.`
    : `${systemPrompt || defaultSystemPrompt}

User question: ${query}

I don't have specific information in the knowledge repository about this topic. Please provide a general helpful response and suggest how the user might find more information or contribute their own knowledge.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    const data: GeminiResponse = await response.json();

    if (data.error) {
      console.error("Gemini API error:", data.error.message);
      return "";
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    return "";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "";
  }
}

// Generate related topics using AI
export async function generateRelatedTopicsAI(query: string, context?: string): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    return [];
  }

  const prompt = `Given the user's search query "${query}"${context ? ` and the following context: ${context.slice(0, 500)}` : ""}, suggest 5 related topics they might want to explore. 
Return ONLY a JSON array of strings, no other text. Example: ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
          temperature: 0.5,
          maxOutputTokens: 256,
        },
      }),
    });

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text.trim();
      // Try to parse JSON array from response
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return [];
        }
      }
    }

    return [];
  } catch (error) {
    console.error("Error generating related topics:", error);
    return [];
  }
}

// Generate text embedding for semantic search
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!GEMINI_API_KEY) {
    console.warn("No Gemini API key - embeddings disabled");
    return null;
  }

  try {
    const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        },
        taskType: "RETRIEVAL_QUERY"
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Gemini Embedding API error:", data.error.message);
      return null;
    }

    if (data.embedding?.values) {
      return data.embedding.values;
    }

    return null;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}
