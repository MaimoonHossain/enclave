import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createLLM } from "./ai/llm";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { pinecone, embeddings } from "./rag";
import { PineconeStore } from "@langchain/pinecone";
import { TavilySearch } from "@langchain/tavily";
// =========================
// 1. Define Tools
// =========================

// Tool A: The Secure Vault (Pinecone)
const vaultSearchTool = tool(
  async ({ query }) => {
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { 
      pineconeIndex: index,
      namespace: process.env.PINECONE_NAMESPACE || "",
    });
    // Optimize: Retrieve 2 highly relevant chunks instead of 3 to save tokens
    const results = await vectorStore.similaritySearch(query, 2);
    
    if (results.length === 0) {
      return "No relevant documents found in the vault.";
    }
    // Optimize: Safe truncate each chunk's page content to 1200 characters to prevent prompt hijacking or bloat
    return results.map(r => r.pageContent.slice(0, 1200)).join("\n\n---\n\n");
  },
  {
    name: "vault_search",
    description: "Search the secure local enclave vault for documents, PDFs, and uploaded knowledge.",
    schema: z.object({ 
      query: z.string().describe("The search query to look up in the vector database") 
    }),
  }
);

// Tool B: The Live Web (Tavily)
const webSearchTool = new TavilySearch({
  maxResults: 2, // Optimize: Retrieve 2 web search results instead of 3 to reduce context length
  tavilyApiKey: process.env.TAVILY_API_KEY || "dummy-key-for-build",
});

const tools = [vaultSearchTool, webSearchTool];
const toolNode = new ToolNode(tools);

// =========================
// 2. Define the Agent Model
// =========================
const model = createLLM().bindTools(tools);

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
async function callModel(state: typeof MessagesAnnotation.State, config: any) {
  const searchMode = config?.configurable?.searchMode || 'default';

  // Determine active tools based on the selected mode
  let activeTools = tools;
  let dynamicPromptExtra = "";

  if (searchMode === 'web') {
    activeTools = [webSearchTool];
    dynamicPromptExtra = "\nCRITICAL: You are in WEB SEARCH ONLY mode. You MUST only use web search. You do not have access to the secure local vault.";
  } else if (searchMode === 'vault') {
    activeTools = [vaultSearchTool];
    dynamicPromptExtra = "\nCRITICAL: You are in VAULT SEARCH ONLY mode. You MUST only use the secure vault search. You do not have access to the live web.";
  }

  // Bind tools dynamically to ensure the LLM cannot see or invoke forbidden tools
  const dynamicModel = createLLM().bindTools(activeTools);

  // Dynamically tailor the system prompt so the LLM is fully aware of its search environment
  const systemPrompt = `
      You are Enclave, an autonomous AI assistant with access to external tools.

      AVAILABLE TOOLS
      ${searchMode !== 'web' ? `
      1. vault_search
      Purpose:
      Searches the user's uploaded private documents and knowledge base.

      Use vault_search when:
      - the user references uploaded files
      - the question may depend on private documents
      - answering requires document-specific information
      - the user asks about contracts, PDFs, notes, reports, or uploaded content

      Important:
      - Never assume document contents.
      - Always search first for document-related questions.
      ` : ''}
      ${searchMode !== 'vault' ? `
      2. tavily_search_results_json
      Purpose:
      Searches the live web for external or current information using Tavily.

      Use tavily_search_results_json when:
      - information may be recent or time-sensitive
      - answering requires external knowledge
      - the answer is uncertain or unavailable in conversation context
      ` : ''}

      GENERAL RULES
      - Prefer retrieval over guessing.
      - Never fabricate tool results.
      - If retrieval is insufficient, say so clearly.
      - You may use multiple tools when necessary.
      - Base final answers on retrieved evidence.
      - Keep answers clear, direct, and accurate.
      ${dynamicPromptExtra}
  `;

  const stream = await dynamicModel.stream([
    {
      role: "system",
      content: systemPrompt.trim()
    },
    ...state.messages
  ], config);

  let finalMessage: any = null;
  for await (const chunk of stream) {
    if (!finalMessage) {
      finalMessage = chunk;
    } else {
      finalMessage = finalMessage.concat(chunk);
    }
  }

  return { messages: [finalMessage] };
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