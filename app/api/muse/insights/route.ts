import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { text, context } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Missing API Key" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an expert literary editor. Analyze the following text snippet (and context if provided) and provide structured insights.

    Context: ${context || "No context"}
    
    Text to Analyze:
    "${text.slice(0, 5000)}" // Limit text length for speed

    Provide the following analysis in JSON format:
    1. "pacing": One of ["Slow", "Moderate", "Fast", "Uneven"]
    2. "tone": A 1-2 word description of the tone (e.g., "Melancholic", "Action-packed").
    3. "sentiment": "Positive" | "Neutral" | "Negative"
    4. "keyEntities": List of up to 5 main characters or locations mentioned.
    5. "suggestions": A list of 1-2 actionable improvements (e.g., "Show, don't tell in paragraph 2", "Dialogue feels stiff").

    Output JSON:
    {
      "pacing": "...",
      "tone": "...",
      "sentiment": "...",
      "keyEntities": ["..."],
      "suggestions": ["..."]
    }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = result.response;
    const jsonString = response.text();
    const data = JSON.parse(jsonString);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Insights API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights." },
      { status: 500 }
    );
  }
}
