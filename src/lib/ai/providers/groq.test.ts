import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateGroq } from './groq'

const args = {
  apiKey: 'gsk_test',
  model: 'llama-3.3-70b-versatile',
  systemPrompt: 'Be concise.',
  messages: [{ role: 'user' as const, content: 'hello' }],
  timeoutMs: 1_000,
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('generateGroq', () => {
  it('sends an OpenAI-compatible request and normalizes usage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'مرحبا' } }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 3,
            total_tokens: 13,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateGroq(args)

    expect(result).toEqual({
      text: 'مرحبا',
      usage: { promptTokens: 10, completionTokens: 3, totalTokens: 13 },
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer gsk_test')
    const body = JSON.parse(init.body)
    expect(body.model).toBe('llama-3.3-70b-versatile')
    expect(body.messages[0]).toEqual({ role: 'system', content: 'Be concise.' })
    expect(body.messages[1]).toEqual({ role: 'user', content: 'hello' })
  })

  it('maps Groq auth failures to invalid_key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'bad key' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(generateGroq(args)).rejects.toMatchObject({
      name: 'AiError',
      code: 'invalid_key',
      status: 401,
    })
  })
})
