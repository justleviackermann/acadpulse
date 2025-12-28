
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * AcadPulse Gemini AI Service
 * This service handles all intelligence-related operations using the latest Gemini 3 models.
 */

// Exported getGeminiAI function as required by VoiceIntel.tsx
export const getGeminiAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Analyzes a single assignment to determine its cognitive load and stress impact.
 */
export const analyzeAssignmentStress = async (title: string, description: string) => {
  const ai = getGeminiAI();
  const prompt = `Evaluate the following academic task for stress impact and cognitive load:
  TASK TITLE: "${title}"
  TASK DESCRIPTION: "${description}"

  Analyze based on:
  1. Estimated deep work hours.
  2. Research complexity vs execution difficulty.
  3. Emotional tax (e.g., high stakes vs routine).
  4. Cascading impact on other potential tasks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional academic stress analyst. Quantify tasks on a 0-100 scale.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Stress score from 0-100." },
            justification: { type: Type.STRING, description: "Brief explanation of the score." },
            estimatedHours: { type: Type.NUMBER, description: "Hours to complete." },
            complexity: { type: Type.STRING, description: "Low, Medium, or High." }
          },
          required: ["score", "justification", "estimatedHours", "complexity"]
        }
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return { score: 50, justification: "Simulation baseline applied.", estimatedHours: 1, complexity: "Medium" };
  }
};

/**
 * Recommends a strategic execution order for a list of tasks.
 */
export const getPrioritization = async (tasks: any[]) => {
  const ai = getGeminiAI();
  const prompt = `Review this student's current workload and recommend a strategic execution order:
  TASKS: ${JSON.stringify(tasks)}

  Provide a sequence that:
  - Mitigates burnout.
  - Maximizes early wins.
  - Prioritizes critical path items.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        systemInstruction: "You are an expert Productivity Architect. Your goal is to optimize cognitive energy flow.",
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
                  sequence: { type: Type.INTEGER, description: "1 is first, 2 is second, etc." },
                  category: { type: Type.STRING, description: "E.g., 'Eat the Frog', 'Quick Win', 'Deep Work Block'." },
                  reason: { type: Type.STRING }
                }
              }
            },
            dailyStrategy: { type: Type.STRING, description: "One overarching theme for the day." }
          },
          required: ["executionOrder", "dailyStrategy"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Prioritization Error:", error);
    return { executionOrder: [], dailyStrategy: "Focus on task completion sequentially." };
  }
};

/**
 * Simulates the impact of delaying a task or taking a specific action.
 */
export const simulateImpact = async (tasks: any[], taskId: string, action: string) => {
  const ai = getGeminiAI();
  const targetTask = tasks.find(t => t.id === taskId);
  const prompt = `SIMULATION SCENARIO:
  Current Workload: ${JSON.stringify(tasks)}
  Proposed Action: "${action}" on Task "${targetTask?.title || taskId}"

  Forecast the stress trajectory and burnout risk.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 8000 },
        systemInstruction: "You are a Predictive Behavioral Analyst for Academic Performance. Forecast psychological load deltas.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newStressScore: { type: Type.NUMBER, description: "Predicted new aggregate stress level (0-100)." },
            burnoutRisk: { type: Type.STRING, description: "Low, Moderate, High, or Critical." },
            warning: { type: Type.STRING, description: "Specific warning about this decision." },
            mitigationTip: { type: Type.STRING, description: "A strategy to reduce the negative impact." }
          },
          required: ["newStressScore", "burnoutRisk", "warning", "mitigationTip"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Simulation Error:", error);
    return { newStressScore: 50, burnoutRisk: "Moderate", warning: "Unable to calculate projection.", mitigationTip: "Stay consistent." };
  }
};

/**
 * Generates high-level stress insights and classifications.
 */
export const getStressInsights = async (tasks: any[]) => {
  const ai = getGeminiAI();
  const prompt = `Provide a holistic analysis of this academic workload:
  DATA: ${JSON.stringify(tasks)}

  Classify the workload type (e.g., 'The Sprint', 'The Marathon', 'The Overload') and give specific cognitive health advice.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an empathetic Academic Coach. Provide professional, data-backed insights.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workloadType: { type: Type.STRING },
            primaryStressor: { type: Type.STRING },
            burnoutRiskScore: { type: Type.NUMBER, description: "0-100 scale." },
            healthInsight: { type: Type.STRING },
            actionableAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["workloadType", "primaryStressor", "burnoutRiskScore", "healthInsight", "actionableAdvice"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Insights Error:", error);
    return { workloadType: "Unclassified", primaryStressor: "Unknown", burnoutRiskScore: 0, healthInsight: "Keep monitoring your pace.", actionableAdvice: [] };
  }
};

export const generateResponse = async (prompt: string) => {
  const ai = getGeminiAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text;
};

export const generateBrainstormImage = async (prompt: string) => {
  const ai = getGeminiAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  return null;
};

// --- Audio Utilities ---
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
  
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
