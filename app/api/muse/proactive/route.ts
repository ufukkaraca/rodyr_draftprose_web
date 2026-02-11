import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

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
    You are an expert editor focusing on logical consistency and clarity. 
    Analyze the following text and identify potential issues.
    
    Context: ${context || "No context"}
    
    Text: "${text.slice(0, 5000)}"

    Focus on:
    1. Logical contradictions (e.g., character behavior inconsistencies).
    2. Confusing phrasing or ambiguity.
    3. Continuity errors.

    Return a JSON object with a list of "issues".
    Each issue should have:
    - "quote": The exact substring from the text that is problematic.
    - "message": A short explanation of the issue.
    - "severity": "warning" | "error"

    Example:
    {
      "issues": [
        { "quote": "She walked through the closed door", "message": "Physical impossibility unless ghost/magic.", "severity": "error" }
      ]
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
    console.error("Proactive API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze." },
      { status: 500 }
    );
  }
}
