import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, AppConfig } from "../types";

// --- Model Definitions ---
export const AVAILABLE_MODELS = [
  // Google Native
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google', description: 'Fast and versatile', isFree: true },
  
  // OpenRouter Free Tier
  { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B', provider: 'openrouter', description: 'Multimodal, 128k context', isFree: true },
  { id: 'qwen/qwen-2.5-vl-7b-instruct:free', name: 'Qwen 2.5 VL 7B', provider: 'openrouter', description: 'Vision & Video understanding', isFree: true },
  { id: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B', provider: 'openrouter', description: 'Efficient multimodal', isFree: true },
  { id: 'meta-llama/llama-3.1-405b-instruct:free', name: 'Llama 3.1 405B', provider: 'openrouter', description: 'State-of-the-art open source', isFree: true },
  { id: 'openrouter/auto', name: 'Free Router', provider: 'openrouter', description: 'Auto-selects best free model', isFree: true },
];

export const generateResponse = async (
  config: AppConfig,
  history: Message[],
  prompt: string,
  contextUrl?: string
): Promise<string> => {
  
  // 1. Build System Instruction
  let systemInstruction = `You are Lumina, a high-fidelity AI agent connected to an MCP (Model Context Protocol) Universal Server.
  Your goal is to assist the user in understanding documentation, architectural patterns, and code generation.
  Always be concise, professional, and use clear formatting.
  
  Tone: Helpful, innovative, precise.
  `;

  if (contextUrl) {
    systemInstruction += `\n\nCONTEXT: The user is asking about documentation located at: ${contextUrl}. 
    Assume you have read and indexed this content via the MCP bridge. 
    If the user asks about specific API endpoints or guides from this URL, answer as if you have full knowledge of that site.`;
  }

  // 2. Route Request based on Provider
  if (config.provider === 'google') {
    return await generateGoogleResponse(config.googleKey, config.selectedModelId, prompt, systemInstruction);
  } else {
    return await generateOpenRouterResponse(config.openRouterKey, config.selectedModelId, history, prompt, systemInstruction);
  }
};

export const generateArchitectureDoc = async (config: AppConfig, url: string): Promise<string> => {
   const prompt = `Perform a comprehensive architectural analysis of the software/system described at: ${url}.
   
   Generate a professional TECHNICAL DESIGN DOCUMENT (TDD) in Markdown.
   
   ### REQUIREMENTS:
   1. **Aesthetics**: Use clean formatting, headers (#, ##, ###), and bullet points. Do not use bold (**) for headers.
   2. **Diagrams**: You MUST include the following Mermaid JS diagrams:
      - A **Sequence Diagram** showing the primary data flow.
      - A **Class Diagram** or **Entity Relationship Diagram** for core components.
      - A **State Diagram** or **Flowchart** for user interaction or system states.
   3. **Structure**:
      - **Executive Summary**: What is this system?
      - **System Architecture**: High-level design patterns used.
      - **Component Design**: Detailed breakdown of modules.
      - **Data Flow**: Sequence diagrams.
      - **Security & Scalability**: Key considerations.
   4. **ASCII Art**: Include a small, creative ASCII art logo or topology map at the very top.
   
   Be creative and precise. Imagine you are the Chief Architect presenting to stakeholders.`;

   const systemInstruction = 'You are a senior software architect with an eye for aesthetic documentation. You produce technical documents that are both informative and visually structured with diagrams.';

   if (config.provider === 'google') {
      return await generateGoogleResponse(config.googleKey, 'gemini-3-flash-preview', prompt, systemInstruction);
   } else {
      // Create a dummy history for OpenRouter single shot
      return await generateOpenRouterResponse(config.openRouterKey, config.selectedModelId, [], prompt, systemInstruction);
   }
}

// --- Google Implementation ---
async function generateGoogleResponse(apiKey: string, model: string, prompt: string, systemInstruction: string): Promise<string> {
  if (!apiKey) throw new Error("Google API Key is missing.");
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "No response generated.";
  } catch (error: any) {
    handleApiError(error);
    return "Error"; // Unreachable due to throw
  }
}

// --- OpenRouter Implementation ---
async function generateOpenRouterResponse(apiKey: string, model: string, history: Message[], prompt: string, systemInstruction: string): Promise<string> {
  if (!apiKey) throw new Error("OpenRouter API Key is missing.");

  // Convert Lumina history to OpenAI format
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.filter(m => !m.isError).map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text
    })),
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin, 
        "X-Title": "Lumina MCP Agent",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenRouter Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response content.";

  } catch (error: any) {
    handleApiError(error);
    return "Error";
  }
}

// --- Error Handler ---
function handleApiError(error: any) {
  console.error("AI API Error:", error);
  const errorStr = JSON.stringify(error);
  if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
    throw new Error("⚠️ API Quota Exceeded (429). Please check your billing or try a free model.");
  }
  throw new Error(error.message || "Failed to generate response.");
}