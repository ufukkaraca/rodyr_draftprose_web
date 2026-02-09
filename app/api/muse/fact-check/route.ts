import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { text, context } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
        You are an expert fact-checker and editor. 
        Your task is to verify the factual accuracy of the following text snippet.
        
        Context (if any):
        ${context || "No context provided."}

        Text to Check:
        "${text}"

        Instructions:
        1. Identify any factual claims in the text.
        2. Verify them against your knowledge base.
        3. If the text is fiction/creative writing, identify internal inconsistencies if context allows, otherwise assume it's fictional world-building but check for real-world anachronisms or errors (e.g. "Napoleon used an iPhone").
        4. Return a concise verdict.

        Output Format (JSON):
        {
            "verdict": "True" | "False" | "Misleading" | "Unverifiable" | "Fictional/Consistent",
            "explanation": "Short explanation of the finding.",
            "sources": ["List of sources if applicable"]
        }
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const response = result.response;
        const jsonString = response.text();
        const data = JSON.parse(jsonString);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Fact Check Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
