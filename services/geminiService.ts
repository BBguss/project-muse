import { GoogleGenAI } from "@google/genai";
import { Character } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCharacterLore = async (name: string, role: string, context: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API Key not configured. Unable to generate lore.";

  try {
    const prompt = `
      Create a short, mysterious, and engaging roleplay intro (max 50 words) for a character named "${name}" who is a "${role}".
      Context: ${context}.
      Language: Indonesian.
      Tone: Epic and Atmospheric.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Lore unavailable due to cosmic interference.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The muse is silent right now. (Error generating content)";
  }
};

export const generateFullCharacterProfile = async (): Promise<Partial<Character> | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const prompt = `
      Generate a unique, creative fantasy/sci-fi roleplay character.
      Language: English (Names/Roles) but Description in Indonesian.
      
      Return ONLY a JSON object with this schema:
      {
        "name": "Character Name",
        "role": "Cool Title (e.g. Shadowblade, High Priestess)",
        "description": "Short mysterious bio (max 30 words) in Indonesian",
        "themeColor": "Tailwind gradient string (e.g. 'from-purple-600 to-slate-900')",
        "familyName": "Name of their faction/house",
        "familyIcon": "one of: crown, sword, shield, star, ghost, flame, zap"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Auto-Gen Error:", error);
    return null;
  }
};