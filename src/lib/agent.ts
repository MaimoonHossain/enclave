import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { pinecone, embeddings } from "./rag";
import { PineconeStore } from "@langchain/pinecone";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";

// =========================
// 1. Define Tools
// =========================

// Tool A: The Secure Vault (Pinecone)
const vaultSearchTool = tool(
  async ({ query }) => {
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });
    const results = await vectorStore.similaritySearch(query, 3);
    
    if (results.length === 0) {
      return "No relevant documents found in the vault.";
    }
    return results.map(r => r.pageContent).join("\n\n---\n\n");
  },
  {
    name: "vault_search",
    description: "Search the secure local enclave vault for documents, PDFs, and uploaded knowledge.",
    schema: z.object({ 
      query: z.string().describe("The search query to look up in the vector database") 
    }),
  }
);

// Tool B: The Live Web (DuckDuckGo)
// This is a free, no-API-key-required web search tool natively built into LangChain
const webSearchTool = new DuckDuckGoSearch({ maxResults: 3 });

const tools = [vaultSearchTool, webSearchTool];
const toolNode = new ToolNode(tools);

// =========================
// 2. Define the Agent Model
// =========================
const model = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  temperature: 0.1, // Low temperature keeps the agent strictly logical when choosing tools
}).bindTools(tools);

// =========================
// 3. Define Graph Routing Logic
// =========================

// This function acts as the "Decision Router"
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as any;
  
  // If the LLM decides it needs information, route to the "tools" execution node
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  
  // Otherwise, if it has the answer, end the cycle
  return "__end__";
}

// This function calls the LLM with the system prompt and current state
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke([
    { 
      role: "system", 
      content: `You are the autonomous assistant for Enclave. 
      You have access to two tools:
      1. vault_search: Use this to search the user's uploaded private documents.
      2. duckduckgo_search: Use this to search the live web for general or current information.
      
      Always use the appropriate tool before answering if you do not know the answer. 
      If you use a tool, formulate your final answer clearly based on the tool's output.` 
    },
    ...state.messages
  ]);
  return { messages: [response] };
}

// =========================
// 4. Compile the Workflow
// =========================
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

export const enclaveAgent = workflow.compile();