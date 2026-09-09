import { AiError, type AiProvider, type ProviderResult } from './types'
import { generateOpenAi } from './providers/openai'
import { generateAnthropic } from './providers/anthropic'
import { generateGroq } from './providers/groq'
import type { ProviderArgs } from './providers/shared'

export interface ModelRoute {
  provider: AiProvider
  model: string
}

/**
 * Canonical deterministic model router.
 *
 * This module is deliberately software, not an agent: provider selection is
 * explicit policy/configuration and must never consume an LLM call. Fallback
 * policy can be added here later after cost/privacy/allowlist controls exist.
 */
export async function routeGeneration(
  route: ModelRoute,
  args: ProviderArgs,
): Promise<ProviderResult> {
  switch (route.provider) {
    case 'openai':
      return generateOpenAi({ ...args, model: route.model })
    case 'anthropic':
      return generateAnthropic({ ...args, model: route.model })
    case 'groq':
      return generateGroq({ ...args, model: route.model })
    default: {
      const unreachable: never = route.provider
      throw new AiError(`Unsupported AI provider: ${String(unreachable)}`, {
        code: 'unsupported_provider',
        status: 400,
      })
    }
  }
}
