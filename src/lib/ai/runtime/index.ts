import { generateReply, type GenerateArgs } from '../generate'
import type { GenerateResult } from '../types'
import { runConversationGraph } from './conversation-graph'

export function aiRuntimeV2Enabled() {
  return process.env.AI_RUNTIME_V2_ENABLED === 'true'
}

/**
 * Canonical runtime entrypoint. Legacy behavior remains the default until
 * LangGraph E2E evidence is approved; enabling the flag switches the same
 * provider-neutral request through the bounded graph.
 */
export async function generateWithRuntime(
  args: GenerateArgs,
): Promise<GenerateResult> {
  if (!aiRuntimeV2Enabled()) return generateReply(args)
  return runConversationGraph(args, { maxLlmCalls: 3 })
}
