
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    console.log("Using Key:", process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Found" : "Missing");

    try {
        // For some reason GoogleGenerativeAI doesn't expose listModels directly on the main class in some versions,
        // but let's try the standard way if available, or just try to instantiate a model.
        // Actually, listModels is on the 'client' usually.
        // But let's try a simple generation with 'gemini-1.5-flash' to verify the error.

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-pro:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-pro:", error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-pro:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-pro:", error.message);
    }
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-2.0-flash-exp:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-2.0-flash-exp:", error.message);
    }
}

listModels();

```
