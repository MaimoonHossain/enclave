import { streamText, generateText, CoreMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { pinecone, embeddings } from '@/lib/rag';
import { PineconeStore } from '@langchain/pinecone';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    // =========================
    // Parse Messages
    // =========================
    const { messages } = await request.json();

    // Transform incoming UI messages to AI SDK CoreMessages
    const coreMessages: CoreMessage[] = messages.map((m: any) => ({
      role: m.role,
      content: m.parts 
        ? m.parts.map((p: any) => (p.type === 'text' ? p.text : '')).join('') 
        : (m.content || ''),
    }));

    // Latest user message
    const latestMessage = coreMessages[coreMessages.length - 1]?.content as string || '';

    // Previous history
    const history = coreMessages.slice(0, -1);

    // =========================
    // Rephrase Question
    // =========================
    let standaloneQuestion = latestMessage;

    if (history.length > 0) {
      const historyText = history
        .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n');

      const rephrasePrompt = `
      Given the following conversation history and the user's latest question,
      rephrase the user's question into a standalone question.

      Do NOT answer the question.

      Chat History:
      ${historyText}

      Latest Question:
      ${latestMessage}

      Standalone Question:
      `;

      const { text } = await generateText({
        model: google('gemini-3-flash-preview'),
        prompt: rephrasePrompt,
      });

      standaloneQuestion = text;

      console.log('Original:', latestMessage);
      console.log('Standalone:', standaloneQuestion);
    }

    // =========================
    // Pinecone Search
    // =========================
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    const searchResults = await vectorStore.similaritySearch(standaloneQuestion, 3);
    const context = searchResults.map((doc) => doc.pageContent).join('\n\n---\n\n');

    // Unique Sources
    const sources = [...new Set(searchResults.map((doc) => doc.metadata.source))];

    // =========================
    // System Prompt
    // =========================
    const systemPrompt = `
You are the intelligent assistant for Enclave,
a secure local knowledge base.

Use ONLY the retrieved context below.

If the answer exists:
- Answer clearly
- End with a natural follow-up question

If the answer does NOT exist:
- Say:
"I cannot find the exact answer to that in the uploaded documents."
- Briefly mention related context
- Ask if the user wants that instead

Context:
${context}
`;

    // =========================
    // Stream Response
    // =========================
    const result = streamText({
      model: google('gemini-3-flash-preview'),
      system: systemPrompt,
      messages: coreMessages, // <-- FIX: Passing the mapped CoreMessages instead of raw frontend messages
    });

    // =========================
    // Return Stream
    // =========================
    return result.toUIMessageStreamResponse({
      headers: {
        'X-Enclave-Sources': JSON.stringify(sources),
      },
    });
  } catch (error: any) {
    console.error('Chat Error:', error.message || error);
    return new Response('Failed to generate response', { status: 500 });
  }
}