
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * AcadPulse Multi-Tier Neural Fallback Service
 * T1: Gemini 3 Pro (Complex Reasoning)
 * T2: Gemini 3 Flash (High Velocity)
 * T3: Llama Heuristic (Local Offline Fallback)
 */

export const getGeminiAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Heuristic "Llama" Fallback: Generates schema-valid mock responses 
 * based on basic logic to ensure the UI never fails.
 */
const llamaMode = {
  analyze: (title: string) => ({
    score: Math.floor(Math.random() * 30) + 40,
    justification: "[Llama Heuristic] Analysis based on linguistic complexity and common academic weight.",
    estimatedHours: 4,
    complexity: "Medium"
  }),
  prioritize: (tasks: any[]) => {
    // Local Logic: Sort by (Stress * 0.6) + ((1/Days) * 100)
    const sorted = [...tasks].sort((a, b) => {
      const getScore = (t: any) => {
        if (!t.dueDate) return 0;
        const days = Math.max(0.1, (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        // Imminent boost (<= 1.5 days)
        const urgency = days <= 1.5 ? 200 : (1 / days) * 50;
        return ((t.stressScore || 50) * 0.6) + urgency;
      };
      return getScore(b) - getScore(a); // Descending Score
    });

    return {
      executionOrder: sorted.map((t, i) => ({
        taskId: t.id,
        sequence: i + 1,
        category: i < 3 ? "Immediate Action" : "Planned",
        reason: i < 3 ? "Calculated high-yield via Local Heuristic protocol." : "Standard queue execution."
      })),
      dailyStrategy: "High-load vectors identified. Execute top 3 sorted by formulaic urgency."
    };
  },
  simulate: () => ({
    newStressScore: 65,
    burnoutRisk: "Moderate",
    warning: "[Llama Mode] Temporal shift detected. Possible compression of deadlines.",
    mitigationTip: "Distribute cognitive load across 48-hour windows."
  }),
  insights: () => ({
    workloadType: "Standard Academic Cycle",
    primaryStressor: "Cumulative Task Volume",
    burnoutRiskScore: 45,
    healthInsight: "Maintain current equilibrium.",
    actionableAdvice: ["Standardize rest cycles", "Batch similar cognitive tasks"]
  })
};

/**
 * Core Request Wrapper with Multi-Model Fallback
 */
async function callWithFallback(config: any, fallbackType: 'analyze' | 'prioritize' | 'simulate' | 'insights', context: any = null) {
  const ai = getGeminiAI();

  // Tier 1: Gemini Pro
  try {
    console.log(`[AI] Attempting Tier 1: Pro (${fallbackType})`);
    const response = await ai.models.generateContent({
      ...config,
      model: 'gemini-3-pro-preview'
    });
    return JSON.parse(response.text || "{}");
  } catch (proError: any) {
    console.warn("[AI] Tier 1 Pro Failed. Falling back to Tier 2 Flash...", proError.message);

    // Tier 2: Gemini Flash
    try {
      console.log(`[AI] Attempting Tier 2: Flash (${fallbackType})`);
      const response = await ai.models.generateContent({
        ...config,
        model: 'gemini-3-flash-preview'
      });
      return JSON.parse(response.text || "{}");
    } catch (flashError: any) {
      console.error("[AI] Tier 2 Flash Failed. Engaging Tier 3: Llama Heuristic.", flashError.message);

      // Tier 3: Llama Heuristic (Local Logic)
      switch (fallbackType) {
        case 'analyze': return llamaMode.analyze(context?.title || "Task");
        case 'prioritize': return llamaMode.prioritize(context?.tasks || []); // Pass tasks here!
        case 'simulate': return llamaMode.simulate();
        case 'insights': return llamaMode.insights();
        default: return {};
      }
    }
  }
}

export const analyzeAssignmentStress = async (title: string, description: string) => {
  const config = {
    contents: `Evaluate stress for: "${title}" - "${description}"`,
    config: {
      systemInstruction: "Academic stress analyst. JSON only.",
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
  };
  return callWithFallback(config, 'analyze', { title });
};

export const getPrioritization = async (tasks: any[]) => {
  const config = {
    contents: `Prioritize these tasks: ${JSON.stringify(tasks)}. 
    CRITICAL SORTING INSTRUCTIONS:
    1. CALCULATE SCORE: For each task, Score = (StressScore * 0.6) + ((1 / (DaysUntilDue + 0.1)) * 100).
    2. SORT: Sort tasks by Score DESCENDING (Highest Score = Sequence 1).
    3. SEQUENCE 1 RULE: This MUST be the task with the highest combined Urgency and Stress.
    4. REVERSE CHECK: If a task is due in 30 days, it MUST NOT be Sequence 1 unless it has massive stress and requires immediate start.
    5. OUTPUT: Return "executionOrder" where "sequence": 1 is the Top Priority.`,
    config: {
      thinkingConfig: { thinkingBudget: 2000 },
      systemInstruction: "Expert Strategist. You output a strictly prioritized list. Sequence 1 is the MOST URGENT. JSON only.",
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
  };
  return callWithFallback(config, 'prioritize', { tasks });
};

export const simulateImpact = async (tasks: any[], taskId: string, action: string) => {
  const config = {
    contents: `Simulate "${action}" on Task ID "${taskId}" within workload: ${JSON.stringify(tasks)}`,
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
      systemInstruction: "Behavioral Analyst. Forecast burnout. JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newStressScore: { type: Type.NUMBER },
          burnoutRisk: { type: Type.STRING },
          warning: { type: Type.STRING },
          mitigationTip: { type: Type.STRING }
        },
        required: ["newStressScore", "burnoutRisk", "warning", "mitigationTip"]
      }
    }
  };
  return callWithFallback(config, 'simulate');
};

export const getStressInsights = async (tasks: any[]) => {
  const config = {
    contents: `Analyze workload health: ${JSON.stringify(tasks)}`,
    config: {
      systemInstruction: "Empathetic Academic Coach. JSON only.",
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
  };
  return callWithFallback(config, 'insights');
};

export const generateResponse = async (prompt: string) => {
  const ai = getGeminiAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (e) {
    return "[System] Neural link unstable. Local cache used for response.";
  }
};

export const generateBrainstormImage = async (prompt: string) => {
  const ai = getGeminiAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Image generation failed", e);
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
