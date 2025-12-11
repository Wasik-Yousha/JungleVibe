import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 
// Initialize AI only if key is present and not the placeholder
const ai = (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') ? new GoogleGenAI({ apiKey }) : null;

export const generateTribeChallenge = async (): Promise<string> => {
  if (!ai) return "The Tribe Leader is meditating. (API Key missing)";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, fun, wild 'Jungle Challenge' or 18+ style spicy icebreaker question for a group chat. Maximum 20 words. Keep it fun and mysterious.",
    });
    return response.text || "Welcome to the Jungle!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The jungle is silent tonight.";
  }
};