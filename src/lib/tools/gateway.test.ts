import { describe, expect, it, vi } from 'vitest'
import { ToolGateway } from './gateway'

const context = {
  accountId: 'acct-1',
  userId: 'user-1',
  conversationId: 'conv-1',
  traceId: 'trace-1',
}

describe('ToolGateway', () => {
  it('does not execute a tool when policy denies it and audits the denial', async () => {
    const execute = vi.fn().mockResolvedValue({ ok: true, output: 'should-not-run' })
    const audit = vi.fn()
    const gateway = new ToolGateway(
      async () => ({ allowed: false, reason: 'write_not_approved' }),
      audit,
    ).register({
      name: 'crm.update_contact',
      description: 'Update a contact',
      risk: 'write',
      execute,
    })

    const result = await gateway.execute({
      name: 'crm.update_contact',
      input: { name: 'A' },
      context,
    })

    expect(result).toEqual({ ok: false, error: 'write_not_approved' })
    expect(execute).not.toHaveBeenCalled()
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: 'trace-1',
        accountId: 'acct-1',
        tool: 'crm.update_contact',
        risk: 'write',
        allowed: false,
        ok: false,
      }),
    )
  })

  it('executes an allowed tool with the original tenant context and audits success', async () => {
    const execute = vi.fn().mockResolvedValue({ ok: true, output: { id: 'contact-1' } })
    const audit = vi.fn()
    const gateway = new ToolGateway(async () => ({ allowed: true }), audit).register({
      name: 'crm.get_contact',
      description: 'Read a contact',
      risk: 'read',
      execute,
    })

    const result = await gateway.execute({
      name: 'crm.get_contact',
      input: { id: 'contact-1' },
      context,
    })

    expect(result).toEqual({ ok: true, output: { id: 'contact-1' } })
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ context: expect.objectContaining({ accountId: 'acct-1' }) }),
    )
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ allowed: true, ok: true, risk: 'read' }),
    )
  })
})
