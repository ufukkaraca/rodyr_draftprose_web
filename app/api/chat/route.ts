import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Use the new SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { messages, context, activeNodeTitle, projectTitle, persona } = await req.json();

    const lastMessage = messages[messages.length - 1];
    
    // Construct System Prompt
    let systemInstruction = `
You are Muse, an intelligent writing assistant for the creative writing tool "DraftProse".
Your goal is to help the author write better, brainstorm ideas, and maintain continuity.

Context:
- Project: "${projectTitle}"
- Current Document: "${activeNodeTitle}"
- Content provided below:
---
${context}
---

Instructions:
- Be concise and helpful.
- Adopt a supportive, creative partner persona.
`;

    if (persona && persona.id !== 'muse') {
         systemInstruction = `
You are a character in the story named "${persona.name}".
You are being interviewed by the author.
Stay in character. Use your voice, tone, and knowledge based on your description.

Character Description:
${persona.content}

Context:
- Project: "${projectTitle}"
- Current Document: "${activeNodeTitle}"
`;
    }

    // Format for @google/genai
    // It seems to take 'contents' array with 'role' and 'parts'.
    // User -> 'user', Model -> 'model'
    
    // We'll prepend system instruction to the inputs or config if supported.
    // The snippet used 'thinkingConfig', but that might be specific to 3-flash.
    // Let's stick to standard content generation first.
    
    // Construct the full prompt sequence including system instruction as first user message?
    // Or use systemInstruction config if available in v1beta/new SDK.
    // The snippet didn't show system instruction, just user role.
    
    // Let's prepend the system instruction to the last message or as a separate user message at the start.
    // Gemini usually handles system instructions better if we can pass it in config, but for now prepending is safer if unsure of SDK surface.
    
    const contents = [
        {
            role: 'user',
            parts: [{ text: `System Instruction: ${systemInstruction}` }]
        },
        {
            role: 'model',
            parts: [{ text: "Understood." }]
        },
        ...messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        })),
        {
            role: 'user',
            parts: [{ text: lastMessage.content }]
        }
    ];

    const result = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        // thinkingConfig: { thinkingLevel: 'HIGH' } // Optional based on user snippet
      }
    });

    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of result) {
                const text = chunk.text;
                if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                }
            }
            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });

  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
