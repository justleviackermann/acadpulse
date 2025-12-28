import { GoogleGenAI, Type } from "@google/genai";

/**
 * AcadPulse Neural Service - Optimized for FREE TIER
 * We primarily use 'gemini-3-flash-preview' as it has the highest
 * free-tier rate limits and fastest response times.
 */

export const getGeminiAI = () => {
  // Always use the named parameter and process.env.API_KEY directly as per guidelines.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Robust logic for AI calls with built-in error handling for rate limits.
 */
async function callAi(config: any) {
  const ai = getGeminiAI();
  try {
    // We use gemini-3-flash-preview for almost everything because it's generous on the free tier.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      ...config
    });
    // The response.text property directly returns the generated string output.
    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    console.error("AI Request Failed:", err.message);
    // If it's a rate limit error (429), we could implement a retry, but for now we return safe defaults.
    return {};
  }
}

export const analyzeAssignmentStress = async (title: string, description: string) => {
  return callAi({
    contents: `Evaluate stress (0-100) for student assignment: "${title}" - "${description}"`,
    config: {
      systemInstruction: "You are an academic stress analyst. Return JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          justification: { type: Type.STRING },
          estimatedHours: { type: Type.NUMBER },
          complexity: { type: Type.STRING }
        },
        required: ["score", "justification", "estimatedHours", "complexity"]
      }
    }
  });
};

export const getPrioritization = async (tasks: any[]) => {
  return callAi({
    contents: `Prioritize these student tasks for maximum mental wellness: ${JSON.stringify(tasks)}`,
    config: {
      systemInstruction: "You are a wellness-focused productivity coach. Help students avoid burnout. JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executionOrder: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                sequence: { type: Type.INTEGER },
                category: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            }
          },
          dailyStrategy: { type: Type.STRING }
        },
        required: ["executionOrder", "dailyStrategy"]
      }
    }
  });
};

export const simulateImpact = async (tasks: any[], taskId: string, action: string) => {
  return callAi({
    contents: `What happens if a student does "${action}" on Task "${taskId}" with this workload: ${JSON.stringify(tasks)}`,
    config: {
      systemInstruction: "Predict student stress impact. JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newStressScore: { type: Type.NUMBER },
          burnoutRisk: { type: Type.STRING },
          warning: { type: Type.STRING },
          mitigationTip: { type: Type.STRING },
          alternativeAction: { type: Type.STRING }
        },
        required: ["newStressScore", "burnoutRisk", "warning", "mitigationTip", "alternativeAction"]
      }
    }
  });
};

export const getStressInsights = async (tasks: any[]) => {
  return callAi({
    contents: `Provide 3 wellness tips for this student workload: ${JSON.stringify(tasks)}`,
    config: {
      systemInstruction: "You are a supportive school counselor. JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          workloadType: { type: Type.STRING },
          primaryStressor: { type: Type.STRING },
          burnoutRiskScore: { type: Type.NUMBER },
          healthInsight: { type: Type.STRING },
          actionableAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["workloadType", "primaryStressor", "burnoutRiskScore", "healthInsight", "actionableAdvice"]
      }
    }
  });
};

export const generateResponse = async (prompt: string) => {
  const ai = getGeminiAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use the .text property directly to access generated text.
    return response.text;
  } catch (e) {
    return "The system is resting. Please try again in a moment.";
  }
};

export const generateBrainstormImage = async (prompt: string) => {
  const ai = getGeminiAI();
  try {
    // Generate images using 'gemini-2.5-flash-image' as it is standard for Flash tier tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        // Correctly iterate and find the inlineData for the image output.
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Image generation failed", e);
  }
  return null;
};

// --- Audio Decoding (Manual for PCM) ---
// Implement manual encoding and decoding methods as required by guidelines for the Live API.
export function decodeBase64Audio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createAudioBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return {
    data: btoa(binary),
    // The supported audio MIME type for the Live API is 'audio/pcm'.
    mimeType: 'audio/pcm;rate=16000',
  };
}
