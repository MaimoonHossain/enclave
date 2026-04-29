import { NextResponse } from 'next/server';
import { pinecone, embeddings } from '@/lib/rag';
import { PineconeStore } from '@langchain/pinecone';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export async function POST(request: Request) {
  try {
    // 1. Get the user's message
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 2. Connect to Pinecone
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    // 3. Similarity Search
    const searchResults = await vectorStore.similaritySearch(message, 3);
    const context = searchResults.map(doc => doc.pageContent).join('\n\n---\n\n');

    // 4. Initialize Gemini (UPDATED CONFIGURATION)
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-3-flash-preview',     // <-- ADDED: The new standard property
      modelName: 'gemini-3-flash-preview',   // <-- KEPT: For LangChain backward compatibility
      temperature: 0.2, 
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    // 5. Construct the prompt
    const prompt = `You are the intelligent assistant for Enclave, a secure local knowledge base. 
    Use ONLY the following retrieved context to answer the user's question. 
    If the answer is not contained in the context, say "I cannot find the answer to that in the uploaded documents." Do not guess.

    Context:
    ${context}

    Question:
    ${message}

    Answer:`;

    // 6. Send to Gemini
    const response = await llm.invoke(prompt);

    return NextResponse.json({ 
      answer: response.content,
      sources: searchResults.map(doc => doc.metadata.source)
    });

  } catch (error: any) {
    console.error('Chat Error:', error.message || error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}