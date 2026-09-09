import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../generate', () => ({
  generateReply: vi.fn(),
}))

import { generateReply } from '../generate'
import { runConversationGraph } from './conversation-graph'

const mockedGenerateReply = vi.mocked(generateReply)

const config = {
  provider: 'groq' as const,
  model: 'llama-3.3-70b-versatile',
  apiKey: 'gsk_test',
  systemPrompt: null,
  isActive: true,
  autoReplyEnabled: true,
  autoReplyMaxPerConversation: 3,
  handoffAgentId: null,
  embeddingsApiKey: null,
}

beforeEach(() => {
  mockedGenerateReply.mockReset()
})

describe('runConversationGraph', () => {
  it('runs exactly one generation node and returns its provider-neutral result', async () => {
    mockedGenerateReply.mockResolvedValue({
      text: 'hello',
      handoff: false,
      usage: { promptTokens: 2, completionTokens: 1, totalTokens: 3 },
    })

    const result = await runConversationGraph({
      config,
      systemPrompt: 'system',
      messages: [{ role: 'user', content: 'hi' }],
    })

    expect(result.text).toBe('hello')
    expect(mockedGenerateReply).toHaveBeenCalledTimes(1)
    expect(mockedGenerateReply).toHaveBeenCalledWith({
      config,
      systemPrompt: 'system',
      messages: [{ role: 'user', content: 'hi' }],
    })
  })

  it('clamps requested workflow budget above the architecture maximum without adding calls', async () => {
    mockedGenerateReply.mockResolvedValue({ text: 'ok', handoff: false, usage: null })

    await runConversationGraph(
      {
        config,
        systemPrompt: 'system',
        messages: [{ role: 'user', content: 'hi' }],
      },
      { maxLlmCalls: 99 },
    )

    expect(mockedGenerateReply).toHaveBeenCalledTimes(1)
  })
})
