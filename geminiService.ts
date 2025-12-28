
import { GoogleGenAI, Type, Blob } from "@google/genai";

export const getGeminiAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Analyzes a single assignment to determine its cognitive load and stress impact.
 * Design Choice: Uses educational psychology frameworks to provide grounded scores.
 */
export const analyzeAssignmentStress = async (title: string, description: string) => {
  const ai = getGeminiAI();
  const prompt = `Evaluate the following assignment based on Bloom's Taxonomy and the Cognitive Load Theory:
  Title: ${title}
  Description: ${description}
  
  Consider:
  - Estimated hours of deep work required.
  - Complexity of research vs. execution.
  - Likely emotional tax on the student.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are an Elite Educational Strategist and Psychologist. Your goal is to quantify academic workload with surgical precision. Return a numeric score (0-100) where 100 is a high-stakes final exam level effort.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { 
            type: Type.NUMBER, 
            description: "The stress impact score from 0 to 100." 
          },
          justification: { 
            type: Type.STRING, 
            description: "A professional 1-2 sentence explanation of the score based on cognitive demand." 
          },
          estimatedHours: {
            type: Type.NUMBER,
            description: "Estimated hours of focused work required."
          }
        },
        required: ["score", "justification", "estimatedHours"],
        propertyOrdering: ["score", "estimatedHours", "justification"]
      }
    },
  });

  return JSON.parse(response.text || "{}");
};

/**
 * Prioritizes a list of tasks using an enhanced Eisenhower Matrix logic.
 * Design Choice: Focuses on "Executive Function" support for students.
 */
export const getPrioritization = async (tasks: any[]) => {
  const ai = getGeminiAI();
  const prompt = `Current Student Workload Data: ${JSON.stringify(tasks)}
  
  Perform an executive function analysis to sort these tasks. 
  Identify the 'Frog' (the most difficult/important task to do first).
  Identify 'Quick Wins' (low effort, high dopamine).
  Identify 'Cascading Risks' (tasks that, if delayed, destroy the schedule).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a Productivity Architect. Help students manage cognitive energy, not just time. Use professional but encouraging tone.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          priorities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                category: { 
                  type: Type.STRING, 
                  description: "Must be one of: DO_NOW, QUICK_WIN, CASCADING_RISK, or POSTPONE." 
                },
                reason: { type: Type.STRING },
                impactOnBurnout: { type: Type.STRING, description: "How completing this helps their mental health." }
              }
            }
          },
          dailyStrategy: {
            type: Type.STRING,
            description: "A 1-sentence overarching theme for the student's day."
          }
        },
        required: ["priorities", "dailyStrategy"]
      }
    },
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Simulates the psychological and scheduling fallout of a specific action.
 */
export const simulateImpact = async (tasks: any[], taskId: string, action: string) => {
  const ai = getGeminiAI();
  const prompt = `Simulation Scenario:
  Current Portfolio: ${JSON.stringify(tasks)}
  Target Task ID: ${taskId}
  Proposed Action: ${action}
  
  Calculate the delta in the student's stress trajectory. Consider 'The Wall' (burnout threshold).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a Predictive Analytics Engine specialized in Student Retention and Mental Health. Forecast outcomes based on stress accumulation patterns.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newStressScore: { type: Type.NUMBER },
          burnoutRisk: { 
            type: Type.STRING, 
            description: "low, moderate, high, or critical." 
          },
          warning: { type: Type.STRING },
          alternativeAction: { 
            type: Type.STRING, 
            description: "A smarter alternative if the burnout risk increases." 
          }
        },
        required: ["newStressScore", "burnoutRisk", "warning", "alternativeAction"]
      }
    },
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Generates a supportive, context-aware wellness insight.
 */
export const getWellnessInsight = async (score: number, risk: string, taskCount: number) => {
  const ai = getGeminiAI();
  const prompt = `Student Stats: Stress ${score}%, Risk ${risk}, Active Tasks ${taskCount}.
  Provide a brief, non-cliché academic wellness insight.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a warm, empathetic Academic Mentor. Avoid corporate speak. Be human and brief.",
    }
  });
  return response.text;
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

// ... Audio decoding functions remain unchanged ...
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

export function createAudioBlob(data: Float32Array): Blob {
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
