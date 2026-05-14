import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";

/**
 * Factory function to create an LLM instance based on the AI_PROVIDER environment variable.
 * Supports "ollama" for local development and "gemini" (default) for production.
 */
export function createLLM() {
  const provider = process.env.AI_PROVIDER || "gemini";

  if (provider === "ollama") {
    return new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
      temperature: 0.1,
    });
  }

  // Default to Gemini
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    temperature: 0.1,
  });
}
