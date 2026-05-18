import { createUIMessageStreamResponse } from 'ai';
import { toUIMessageStream } from '@ai-sdk/langchain';
import { enclaveAgent } from '@/lib/agent';

export const maxDuration = 60; // Increased for Local LLM stability

// Helper function to add a timeout to the stream
async function* streamWithTimeout(stream: AsyncGenerator<any>, timeoutMs: number) {
  const iterator = stream[Symbol.asyncIterator]();
  while (true) {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
    });

    try {
      const result = await Promise.race([iterator.next(), timeoutPromise]) as any;
      clearTimeout(timeoutId!);
      if (result.done) break;
      yield result.value;
    } catch (error: any) {
      clearTimeout(timeoutId!);
      if (error.message === 'TIMEOUT') {
        // Yield a LangGraph-compatible event with a friendly message
        yield {
          event: "on_chat_model_stream",
          data: {
            chunk: {
              content: "\n\n*Server is busy or not responding. Please try again later.*"
            }
          }
        };
        break; // End the stream gracefully
      } else {
        throw error;
      }
    }
  }
}

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming request from the frontend
    const { messages, searchMode = 'default' } = await request.json();

    // 2. Map Vercel UI messages to the strict format expected by LangChain
    // We removed the broken CoreMessage type and map it natively
    const mappedMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.parts 
        ? m.parts.map((p: any) => (p.type === 'text' ? p.text : '')).join('') 
        : (m.content || ''),
    }));

    // 3. Kick off the autonomous Agent workflow
    const rawEventStream = await enclaveAgent.streamEvents(
      { messages: mappedMessages },
      { 
        version: 'v2', 
        signal: request.signal,
        configurable: { searchMode }
      }
    );

    // 4. Wrap with a 45s timeout to send a friendly message if the model hangs
    // This must be shorter than maxDuration (60s) to prevent Vercel from killing the process with a 500 error
    const eventStream = streamWithTimeout(rawEventStream as any, 45000);

    // 5. Adapt the LangGraph event stream into a Vercel v6 UI Message Stream!
    return createUIMessageStreamResponse({
      stream: toUIMessageStream(eventStream),
    });

  } catch (error: any) {
    console.error('Agent Error:', error.message || error);
    return new Response('Failed to execute agent workflow', { status: 500 });
  }
}