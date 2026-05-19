import { GoogleGenerativeAIEmbeddings, GoogleGenerativeAIEmbeddingsParams } from "@langchain/google-genai";
import { OllamaEmbeddings } from "@langchain/ollama";

/**
 * Custom subclass of GoogleGenerativeAIEmbeddings to support configuring the output dimensionality.
 * This ensures that Gemini models (which default to 3072 dimensions in newer versions) return
 * exactly 768 dimensions to match our Pinecone index.
 */
class EnclaveGoogleEmbeddings extends (GoogleGenerativeAIEmbeddings as any) {
  private outputDimensionality?: number;

  constructor(fields?: GoogleGenerativeAIEmbeddingsParams & { outputDimensionality?: number }) {
    super(fields);
    this.outputDimensionality = fields?.outputDimensionality;
  }

  // Override internal convert to content helper
  private _convertToContent(text: string) {
    const base = super._convertToContent(text);
    if (this.outputDimensionality) {
      base.outputDimensionality = this.outputDimensionality;
    }
    return base;
  }
}

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

  // Default to Gemini (forced to 768 dimensions to match our Pinecone index)
  return new EnclaveGoogleEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001",
    outputDimensionality: 768,
  }) as unknown as GoogleGenerativeAIEmbeddings;
}
