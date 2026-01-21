
import { GoogleGenAI, Type } from "@google/genai";
import { RockIdentification, DrainageRegion, ScanningMode } from './types';
import { SYSTEM_INSTRUCTION } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const identifyRock = async (
  base64Image: string,
  region: DrainageRegion,
  mode: ScanningMode
): Promise<RockIdentification | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Current Mode: ${mode}. Drainage Context: ${region}. Provide a detailed geological analysis using your internal Multi-Head CNN and Petrography logic.`,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    if (!data.name || data.confidence < 0.3) return null;

    return data as RockIdentification;
  } catch (error) {
    console.error("Gemini Identification Error:", error);
    return null;
  }
};
