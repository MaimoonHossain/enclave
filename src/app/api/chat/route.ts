import { NextResponse } from 'next/server';
import { pinecone, embeddings } from '@/lib/rag';
import { PineconeStore } from '@langchain/pinecone';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export async function POST(request: Request) {
  try {
    // 1. Now we extract BOTH the new message and the previous chat history
    const body = await request.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-3-flash-preview',
      temperature: 0.2,
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    // 2. The Rephraser Step: Contextualize the question if there is a history
    let standaloneQuestion = message;
    
    if (history && history.length > 0) {
      const historyText = history.map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
      
      const rephrasePrompt = `Given the following conversation history and the user's latest question, rephrase the user's question to be a standalone question that can be understood without the history. Do NOT answer the question, just rephrase it.
      
      Chat History:
      ${historyText}
      
      Latest Question: ${message}
      
      Standalone Question:`;
      
      const rephraseResponse = await llm.invoke(rephrasePrompt);
      standaloneQuestion = rephraseResponse.content;
      console.log("Original Q:", message, "| Standalone Q:", standaloneQuestion); // For your terminal to see the magic
    }

    // 3. Connect to Pinecone and Search using the STANDALONE question
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    const searchResults = await vectorStore.similaritySearch(standaloneQuestion, 3);
    const context = searchResults.map(doc => doc.pageContent).join('\n\n---\n\n');

    // 4. Construct the final prompt using the retrieved context and standalone question
    const finalPrompt = `You are the intelligent assistant for Enclave, a secure local knowledge base. 
    Use ONLY the following retrieved context to answer the user's question. Do not guess.

    IF YOU FIND THE ANSWER: 
    Answer the question clearly, and end with a single, natural follow-up question to keep the conversation going.

    IF YOU CANNOT FIND THE ANSWER:
    Say "I cannot find the exact answer to that in the uploaded documents." Then, briefly mention what the context DOES say about the person or topic, and ask if the user would like to know about that instead.

    Context:
    ${context}

    Question:
    ${standaloneQuestion}

    Answer:`;

    // 5. Send to Gemini for the final answer
    const response = await llm.invoke(finalPrompt);

    return NextResponse.json({ 
      answer: response.content,
      sources: searchResults.map(doc => doc.metadata.source)
    });

  } catch (error: any) {
    console.error('Chat Error:', error.message || error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}