import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { generateReply, type GenerateArgs } from '../generate'
import { AiError, type GenerateResult } from '../types'

const ConversationState = Annotation.Root({
  config: Annotation<GenerateArgs['config']>(),
  systemPrompt: Annotation<string>(),
  messages: Annotation<GenerateArgs['messages']>(),
  llmCalls: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
  // Plain annotations are intentionally initialized by the invocation.
  // LangGraph's typed Annotation API requires a reducer when a `default`
  // option is supplied, and these two fields are overwrite-only state.
  maxLlmCalls: Annotation<number>(),
  result: Annotation<GenerateResult | null>(),
})

async function generateNode(state: typeof ConversationState.State) {
  if (state.llmCalls >= state.maxLlmCalls) {
    throw new AiError('AI workflow LLM-call budget exhausted.', {
      code: 'llm_budget_exhausted',
      status: 429,
    })
  }

  const result = await generateReply({
    config: state.config,
    systemPrompt: state.systemPrompt,
    messages: state.messages,
  })

  return { result, llmCalls: 1 }
}

/**
 * Phase-1 bounded graph: exactly one generation node and no loop.
 * Future RAG/tool/supervisor nodes must preserve the hard workflow call budget.
 */
const conversationGraph = new StateGraph(ConversationState)
  .addNode('generate', generateNode)
  .addEdge(START, 'generate')
  .addEdge('generate', END)
  .compile()

export async function runConversationGraph(
  args: GenerateArgs,
  opts: { maxLlmCalls?: number } = {},
): Promise<GenerateResult> {
  const maxLlmCalls = Math.min(3, Math.max(1, opts.maxLlmCalls ?? 3))
  const state = await conversationGraph.invoke({
    config: args.config,
    systemPrompt: args.systemPrompt,
    messages: args.messages,
    llmCalls: 0,
    maxLlmCalls,
    result: null,
  })

  if (!state.result) {
    throw new AiError('AI runtime completed without a generation result.', {
      code: 'runtime_no_result',
    })
  }

  return state.result
}
