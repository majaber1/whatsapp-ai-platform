import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  afterCallbacks: [] as Array<() => Promise<void> | void>,
  filters: [] as Array<{ table: string; operation: string; column: string; value: unknown }>,
}))

vi.mock('next/server', () => ({
  after: (cb: () => Promise<void> | void) => h.afterCallbacks.push(cb),
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, init }),
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from(table: string) {
      if (table === 'whatsapp_config') {
        return {
          select: () => ({
            eq: (column: string, value: unknown) => {
              h.filters.push({ table, operation: 'select', column, value })
              const suffix = value === 'pn-a' ? 'a' : value === 'pn-b' ? 'b' : null
              return Promise.resolve({
                data: suffix
                  ? [{
                      id: `cfg-${suffix}`,
                      account_id: `acc-${suffix}`,
                      user_id: `user-${suffix}`,
                      access_token: 'enc',
                    }]
                  : [],
                error: null,
              })
            },
          }),
        }
      }

      if (table === 'messages') {
        return {
          update: () => ({
            eq: (column1: string, value1: unknown) => {
              h.filters.push({ table, operation: 'update', column: column1, value: value1 })
              return {
                eq: (column2: string, value2: unknown) => {
                  h.filters.push({ table, operation: 'update', column: column2, value: value2 })
                  return Promise.resolve({ error: null })
                },
              }
            },
          }),
          select: () => ({
            eq: (column1: string, value1: unknown) => {
              h.filters.push({ table, operation: 'select', column: column1, value: value1 })
              return {
                eq: (column2: string, value2: unknown) => {
                  h.filters.push({ table, operation: 'select', column: column2, value: value2 })
                  return {
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }
                },
              }
            },
          }),
        }
      }

      if (table === 'broadcast_recipients') {
        return {
          select: () => ({
            eq: (column1: string, value1: unknown) => {
              h.filters.push({ table, operation: 'select', column: column1, value: value1 })
              return {
                eq: (column2: string, value2: unknown) => {
                  h.filters.push({ table, operation: 'select', column: column2, value: value2 })
                  return {
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }
                },
              }
            },
          }),
        }
      }

      throw new Error(`unexpected table in CR-001 status test: ${table}`)
    },
  }),
}))

vi.mock('@/lib/whatsapp/encryption', () => ({
  decrypt: () => 'plain-token',
  encrypt: (v: string) => v,
  isLegacyFormat: () => false,
}))
vi.mock('@/lib/whatsapp/meta-api', () => ({ getMediaUrl: vi.fn(), downloadMedia: vi.fn() }))
vi.mock('@/lib/whatsapp/mirror-inbound-media', () => ({ mirrorInboundMedia: vi.fn() }))
vi.mock('@/lib/contacts/dedupe', () => ({
  findExistingContact: vi.fn(),
  isUniqueViolation: () => false,
}))
vi.mock('@/lib/conversations/reopen', () => ({ reopenClosedConversation: vi.fn() }))
vi.mock('@/lib/whatsapp/webhook-signature', () => ({
  verifyMetaWebhookSignature: () => true,
}))
vi.mock('@/lib/automations/engine', () => ({ runAutomationsForTrigger: vi.fn() }))
vi.mock('@/lib/flows/engine', () => ({ dispatchInboundToFlows: vi.fn() }))
vi.mock('@/lib/ai/auto-reply', () => ({ dispatchInboundToAiReply: vi.fn() }))
vi.mock('@/lib/webhooks/deliver', () => ({ dispatchWebhookEvent: vi.fn() }))
vi.mock('@/lib/whatsapp/template-webhook', () => ({
  handleTemplateWebhookChange: vi.fn(),
  isTemplateWebhookField: () => false,
}))

import { POST } from './route'

function statusRequest(phoneNumberId: string, wamid: string) {
  const body = {
    entry: [{
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '+15550000000', phone_number_id: phoneNumberId },
          statuses: [{
            id: wamid,
            status: 'delivered',
            timestamp: '1700000000',
            recipient_id: '15551230000',
          }],
        },
      }],
    }],
  }

  return {
    text: async () => JSON.stringify(body),
    headers: { get: () => 'sha256=stub' },
  } as unknown as Request
}

async function runStatus(phoneNumberId: string, wamid: string) {
  h.afterCallbacks = []
  await POST(statusRequest(phoneNumberId, wamid))
  for (const cb of h.afterCallbacks) await cb()
}

beforeEach(() => {
  h.afterCallbacks = []
  h.filters = []
})

describe('CR-001 provider-message identity', () => {
  it('scopes the same WAMID independently to each WhatsApp connection', async () => {
    const collidingWamid = 'wamid.SAME-ID-ON-TWO-CONNECTIONS'

    await runStatus('pn-a', collidingWamid)
    await runStatus('pn-b', collidingWamid)

    const messageUpdateFilters = h.filters.filter(
      (f) => f.table === 'messages' && f.operation === 'update'
    )

    expect(messageUpdateFilters).toEqual([
      { table: 'messages', operation: 'update', column: 'message_id', value: collidingWamid },
      { table: 'messages', operation: 'update', column: 'whatsapp_config_id', value: 'cfg-a' },
      { table: 'messages', operation: 'update', column: 'message_id', value: collidingWamid },
      { table: 'messages', operation: 'update', column: 'whatsapp_config_id', value: 'cfg-b' },
    ])

    const broadcastConfigScopes = h.filters.filter(
      (f) =>
        f.table === 'broadcast_recipients' &&
        f.operation === 'select' &&
        f.column === 'whatsapp_config_id'
    )
    expect(broadcastConfigScopes.map((f) => f.value)).toEqual(['cfg-a', 'cfg-b'])

    const messageLookupConfigScopes = h.filters.filter(
      (f) =>
        f.table === 'messages' &&
        f.operation === 'select' &&
        f.column === 'whatsapp_config_id'
    )
    expect(messageLookupConfigScopes.map((f) => f.value)).toEqual(['cfg-a', 'cfg-b'])
  })
})
