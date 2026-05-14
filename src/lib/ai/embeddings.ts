import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OllamaEmbeddings } from "@langchain/ollama";

/**
 * Factory function to create an Embeddings instance based on the EMBEDDING_PROVIDER environment variable.
 * Supports "ollama" for local development and "gemini" (default) for production.
 */
export function createEmbeddings() {
  const provider = process.env.EMBEDDING_PROVIDER || "gemini";

  if (provider === "ollama") {
    return new OllamaEmbeddings({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
    });
  }

  // Default to Gemini
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001",
  });
}
