import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

let groq: Groq | null = null;
let ai: GoogleGenAI | null = null;

// =========================
// 🔑 INIT CLIENTS
// =========================
function getGroqClient() {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }
    groq = new Groq({ apiKey });
  }
  return groq;
}

function getGeminiClient() {
  if (!ai) {
    let apiKey = process.env.GEMINI_API_KEY;
    // We can also fallback to GROQ_API_KEY if we want, but let's stick to GEMINI_API_KEY
    if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey === "<your_api_key>") {
      throw new Error("GEMINI_API_KEY is missing or invalid");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// =========================
// 📄 LOAD SYSTEM PROMPT SAFELY // =========================
let SYSTEM_PROMPT = "";
try {
  SYSTEM_PROMPT = fs.readFileSync(
    path.join(process.cwd(), "prompts", "system_prompt.txt"),
    "utf-8"
  );
} catch (err) {
  console.error("Failed to load system prompt:", err);
  SYSTEM_PROMPT = "You are a professional prompt engineer.";
}

function detectIntent(userInput: string) {
  const lowerInput = userInput.toLowerCase();
  if (lowerInput.match(/\b(explain|what is|how to|describe|guide|tutorial|rules)\b/)) return "EXPLAIN";
  if (lowerInput.match(/\b(build|create|write|develop|make|generate)\b/)) return "CREATE";
  if (lowerInput.match(/\b(design|ui|ux|layout|wireframe|mockup)\b/)) return "DESIGN";
  if (lowerInput.match(/\b(analyze|data|metrics|review|check|evaluate)\b/)) return "ANALYZE";
  if (lowerInput.match(/\b(plan|strategy|campaign|market|seo)\b/)) return "STRATEGY";
  return "GENERATE";
}

function detectDomain(userInput: string) {
  const lowerInput = userInput.toLowerCase();
  if (lowerInput.match(/\b(cricket|football|soccer|tennis|sports|game|match)\b/)) return "SPORTS";
  if (lowerInput.match(/\b(website|app|frontend|backend|api|software|code|react|node)\b/)) return "SOFTWARE";
  if (lowerInput.match(/\b(marketing|ads|campaign|seo|business|startup|sales|plan)\b/)) return "BUSINESS";
  if (lowerInput.match(/\b(design|ui|ux|graphics|logo|brand)\b/)) return "DESIGN";
  if (lowerInput.match(/\b(writing|blog|article|content|copywriting)\b/)) return "CONTENT";
  return "GENERAL";
}

function generateRole(userInput: string) {
  const intent = detectIntent(userInput);
  const domain = detectDomain(userInput);
  if (intent === "EXPLAIN" && domain === "SPORTS") return "Senior International Cricket Umpire with 15+ years of experience in match officiating and rule enforcement";
  if (intent === "CREATE" && domain === "SOFTWARE") return "Senior Full Stack Web Developer with 10+ years of experience in software architecture and modern web technologies";
  if (intent === "DESIGN" && domain === "DESIGN") return "Senior UI/UX Designer with 10+ years of experience in product interface design and user experience architecture";
  if (intent === "STRATEGY" && domain === "BUSINESS") return "Senior Digital Marketing Strategist with 10+ years of experience in brand growth and campaign planning";
  if (intent === "ANALYZE" && domain === "BUSINESS") return "Expert Business Data Analyst with 10+ years of experience in market research and data-driven insights";
  if (intent === "CREATE" && domain === "CONTENT") return "Senior Content Strategist with 10+ years of experience in professional writing and brand communication";
  if (userInput.toLowerCase().includes("interview")) return "Senior Technical Interviewer with 15+ years of experience in hiring specialized professionals";
  if (userInput.toLowerCase().includes("learn") || intent === "EXPLAIN") return "Expert Educator with 10+ years of experience in teaching complex concepts simply and effectively";
  return "Experienced AI Assistant with broad domain expertise";
}

function isFallbackError(err: any): boolean {
  if (!err) return false;
  // Fallback on timeout
  if (err.message && err.message.includes("timeout")) return true;
  // Fallback on network failure
  if (err.name === "FetchError" || err.type === "system") return true;
  if (err.status === 429 || err.status === 408 || err.status >= 500) return true;
  if (err.toString().includes("429") || err.toString().includes("RateLimit")) return true;
  return false;
}

// Ensure tokens are roughly controlled (just naive truncation for now if too large)
function enforceTokenLimit(input: string, limit: number = 6000): string {
  // roughly 4 chars per token, so 6000 tokens ~ 24000 chars. We trim input to maximum 24k chars to be safe.
  if (input.length > limit * 4) {
    return input.substring(0, limit * 4) + "... [Truncated]";
  }
  return input;
}

async function generateWithGroq70B({ systemMessage, userMessage, temperature, maxTokens }: any) {
  const client = getGroqClient();
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ],
    temperature,
    max_tokens: maxTokens,
    top_p: 1,
  });

  const text = response?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from Groq API");
  return text;
}

async function generateWithGemini({ systemMessage, userMessage, temperature, maxTokens }: any) {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    config: {
      systemInstruction: systemMessage,
      temperature,
      maxOutputTokens: maxTokens,
    }
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Empty response from Gemini API");
  return text;
}

async function generateWithGroq8B({ messages, temperature, maxTokens }: any) {
  const client = getGroqClient();
  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const text = response?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from Groq API");
  return text;
}

export async function routeRequest(type: "PROMPT_GENERATION" | "CHAT_ASSISTANT", params: any) {
  if (type === "PROMPT_GENERATION") {
    // ⏱ TIMEOUT WRAPPER
    const timeoutMsg = "AI request timeout";
    const withTimeout = (promise: Promise<any>, ms: number) => {
      let timeoutHandle: any;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(timeoutMsg)), ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
    };

    try {
      return await withTimeout(generateWithGroq70B(params), 15000);
    } catch (err: any) {
      if (isFallbackError(err) || err.message === timeoutMsg) {
        console.warn("Groq high-quality failed due to network/timeout. Falling back to Gemini:", err.message);
        return await withTimeout(generateWithGemini(params), 15000);
      }
      throw err; // Bad input or formatting issue
    }
  }

  if (type === "CHAT_ASSISTANT") {
    return await generateWithGroq8B(params);
  }

  throw new Error("Unknown request type");
}

// =========================
// 🚀 MAIN FUNCTIONS
// =========================
export async function generatePrompt(
  userInput: string,
  mode: "normal" | "advanced"
): Promise<string> {
  if (!userInput || typeof userInput !== "string") {
    throw new Error("Invalid input");
  }
  if (!["normal", "advanced"].includes(mode)) {
    throw new Error("Invalid mode");
  }

  const isAdvanced = mode === "advanced";
  const temperature = isAdvanced ? 0.3 : 0.2;
  const maxTokens = isAdvanced ? 1500 : 700;

  const roleLine = `Act as a ${generateRole(userInput)}.`;
  
  const formattedUserInput = `
User Input & Context:
${userInput}
`.trim();

  // Combine role + system prompt mapping
  const systemMessage = `${roleLine}\n\n${SYSTEM_PROMPT}`;

  // estimate tokens roughly and trim input
  const safeUserInput = enforceTokenLimit(formattedUserInput);

  try {
    return await routeRequest("PROMPT_GENERATION", {
      systemMessage,
      userMessage: safeUserInput,
      temperature,
      maxTokens
    });
  } catch (err: any) {
    console.error("LLM Failed:", err);
    throw new Error("Prompt generation failed after retry: " + err.message);
  }
}

export async function generateChat(
  messages: Array<{role: 'system'|'user'|'assistant', content: string}>
): Promise<string> {
  // truncate previous chat context if too long
  let safeMessages = [...messages];
  let chars = 0;
  for (let i = safeMessages.length - 1; i >= 0; i--) {
    chars += safeMessages[i].content.length;
    if (chars > 24000) {
      safeMessages = safeMessages.slice(i);
      break;
    }
  }

  try {
    return await routeRequest("CHAT_ASSISTANT", {
      messages: safeMessages,
      temperature: 0.5,
      maxTokens: 500
    });
  } catch (err) {
    console.warn("AI chat call failed:", err);
    throw err;
  }
}

