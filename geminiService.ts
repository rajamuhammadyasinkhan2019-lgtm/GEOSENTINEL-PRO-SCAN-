
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RockIdentification, DrainageRegion, ScanningMode, ChatMessage } from './types';
import { SYSTEM_INSTRUCTION } from './constants';

// Initialize the Google GenAI client correctly with a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const identifyRock = async (
  base64Image: string,
  region: DrainageRegion,
  mode: ScanningMode
): Promise<RockIdentification | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Current Mode: ${mode}. Drainage Context: ${region}. Provide a detailed geological analysis.`,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    // Access the text property directly without calling it as a method.
    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    return data as RockIdentification;
  } catch (error) {
    console.error("Identification Error:", error);
    return null;
  }
};

export const visualizeEnvironment = async (
  identification: RockIdentification
): Promise<string | null> => {
  try {
    const prompt = `A cinematic, high-detail geological reconstruction of the formation environment for a ${identification.name}. Age: ${identification.geologicalAge}. National Geographic style.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    // Iterate through all parts to find the image part, as it may not be the first part.
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Visualization Error:", error);
    return null;
  }
};

/**
 * Specimen Intelligence Assistant
 * Uses Search Grounding to answer geologist's field questions.
 */
export const askAssistant = async (
  query: string,
  context: RockIdentification,
  history: ChatMessage[]
): Promise<ChatMessage | null> => {
  try {
    const chatContext = `You are a geological assistant. You are currently analyzing a ${context.name} (${context.lithology}) from ${context.metadata.origin}. 
    Specimen Data: Texture: ${context.metadata.texture}, Rarity: ${context.metadata.rarity}. 
    Use Google Search to provide factual, up-to-date regional geological and industrial data.`;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: chatContext,
        tools: [{ googleSearch: {} }],
      },
    });

    // sendMessage only takes the message parameter. History is handled by the chat object if provided in create, but here we pass single message.
    const response = await chat.sendMessage({ message: query });
    const text = response.text || '';
    
    // Extract website URLs from groundingChunks as required by the guidelines.
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return {
      role: 'model',
      text,
      sources: sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i) // Uniq
    };
  } catch (error) {
    console.error("Assistant Error:", error);
    return null;
  }
};
