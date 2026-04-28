import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PineconeStore } from '@langchain/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';


// 1. Initialize the Pinecone Client
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// 2. Initialize Gemini Embeddings
// We use text-embedding-004 as it's Google's latest and most efficient embedding model
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  modelName: 'text-embedding-004', 
});

// 3. Document Processing and Ingestion Utility
export async function processAndEmbed(text: string, sourceName: string) {
  // Chunking strategy: 1000 characters per chunk, with 200 characters of overlap 
  // to prevent cutting off context mid-sentence.
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // Attach metadata so we know where the chunk came from later
  const docs = await splitter.createDocuments([text], [{ source: sourceName }]);

  // Connect to the specific Pinecone index
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  // Load chunks into Pinecone using the Gemini Embeddings
  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex: index,
    maxConcurrency: 5, // Throttles parallel requests to avoid hitting free-tier rate limits
  });

  return docs.length; // Return how many chunks were created
}