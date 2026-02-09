/**
 * TTS Narration Generator for DraftProse Promo Video
 *
 * Uses Gemini 2.5 Flash TTS to generate WAV narration files for each scene.
 * Run: npm run video:tts
 */

import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
config({ path: resolve(projectRoot, ".env") });

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  "";

if (!apiKey) {
  console.error("Error: No GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY found in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Scene narration texts (must match audio-config.ts)
const SCENE_NARRATIONS = [
  "A writing studio built for novelists.",
  "Everything you need — binder, editor, and AI assistant — in one workspace.",
  "Organize chapters, scenes, and ideas. Switch to corkboard for the big picture.",
  "Meet Muse — your AI writing companion. Ask for help brainstorming, drafting, or editing.",
  "Interview your characters. They stay in character and reveal details you hadn't planned.",
  "AI-powered analysis catches pacing issues, tone shifts, and inconsistencies — in real time.",
  "Set word count goals. Enter focus mode. Just you and the page.",
  "When you're ready, compile to Word, PDF, or Markdown — with live preview.",
  "Your story deserves the best tools.",
  "DraftProse — powered by Google Gemini.",
];

const OUTPUT_DIR = resolve(projectRoot, "public", "audio");

/**
 * Create a WAV header for raw PCM data.
 * Gemini TTS returns 24kHz, 16-bit, mono PCM.
 */
function createWavHeader(pcmByteLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(pcmByteLength + headerSize - 8, 4);
  buffer.write("WAVE", 8);

  // fmt subchunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(pcmByteLength, 40);

  return buffer;
}

async function generateNarration(text, sceneNumber) {
  console.log(`  Generating scene ${sceneNumber}: "${text}"`);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Kore",
          },
        },
      },
    },
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error(`No audio data returned for scene ${sceneNumber}`);
  }

  // Decode base64 PCM data
  const pcmBuffer = Buffer.from(audioData, "base64");

  // Prepend WAV header
  const wavHeader = createWavHeader(pcmBuffer.length);
  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

  const outputPath = resolve(OUTPUT_DIR, `narration-scene-${sceneNumber}.wav`);
  writeFileSync(outputPath, wavBuffer);
  console.log(`  ✓ Saved ${outputPath} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log("DraftProse TTS Narration Generator");
  console.log("==================================\n");

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}\n`);
  }

  console.log(`Generating ${SCENE_NARRATIONS.length} narration files...\n`);

  for (let i = 0; i < SCENE_NARRATIONS.length; i++) {
    await generateNarration(SCENE_NARRATIONS[i], i + 1);
  }

  console.log("\n✓ All narration files generated successfully!");
  console.log(`  Output directory: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("TTS generation failed:", err);
  process.exit(1);
});
