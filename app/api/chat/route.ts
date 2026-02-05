
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are Muse, a creative writing assistant for Wryter. You help authors with plotting, character development, and research. Be concise, encouraging, and creative."
    });

    // Transform messages to Gemini format
    // Note: Gemini expects 'user' and 'model' roles. 'system' is separate.
    // If previous messages exist, we need to format them correctly for history.
    // However, simplest way for single-turn or simple multi-turn is to feed history if possible
    // or just the last prompt if we use generateContent directly.
    // For ChatSession we need proper history.
    
    const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
        history: history,
    });

    const result = await chat.sendMessageStream(lastMessage);

    // Create a stream
    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                controller.enqueue(new TextEncoder().encode(chunkText));
            }
            controller.close();
        }
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });

  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
