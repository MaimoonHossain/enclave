import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PineconeStore } from '@langchain/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  modelName: 'gemini-embedding-001',
});

export async function processAndEmbed(text: string, sourceName: string) {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  let docs = await splitter.createDocuments([cleanText], [{ source: sourceName }]);
  docs = docs.filter(doc => doc.pageContent.length > 10);

  if (docs.length === 0) {
    throw new Error("Document is empty or text could not be extracted.");
  }

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex: index,
  });

  return docs.length; 
}