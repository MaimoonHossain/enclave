import { createUIMessageStreamResponse } from 'ai';
import { toUIMessageStream } from '@ai-sdk/langchain';
import { enclaveAgent } from '@/lib/agent';

export const maxDuration = 60; // Increased for Local LLM stability

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming request from the frontend
    const { messages } = await request.json();

    // 2. Map Vercel UI messages to the strict format expected by LangChain
    // We removed the broken CoreMessage type and map it natively
    const mappedMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.parts 
        ? m.parts.map((p: any) => (p.type === 'text' ? p.text : '')).join('') 
        : (m.content || ''),
    }));

    // 3. Kick off the autonomous Agent workflow
    const eventStream = await enclaveAgent.streamEvents(
      { messages: mappedMessages },
      { version: 'v2', signal: request.signal }
    );

    // 4. Adapt the LangGraph event stream into a Vercel v6 UI Message Stream!
    return createUIMessageStreamResponse({
      stream: toUIMessageStream(eventStream),
    });

  } catch (error: any) {
    console.error('Agent Error:', error.message || error);
    return new Response('Failed to execute agent workflow', { status: 500 });
  }
}