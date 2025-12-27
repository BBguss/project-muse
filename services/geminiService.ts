import { GoogleGenAI } from "@google/genai";

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