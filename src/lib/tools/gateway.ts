export type ToolRisk = 'read' | 'write' | 'destructive'

export interface ToolContext {
  accountId: string
  userId: string | null
  conversationId?: string | null
  aiEmployeeId?: string | null
  traceId: string
}

export interface ToolCall<I = unknown> {
  name: string
  input: I
  context: ToolContext
}

export interface ToolResult<O = unknown> {
  ok: boolean
  output?: O
  error?: string
}

export interface ToolDefinition<I = unknown, O = unknown> {
  name: string
  description: string
  risk: ToolRisk
  execute: (call: ToolCall<I>) => Promise<ToolResult<O>>
}

export interface ToolAuthorizationDecision {
  allowed: boolean
  reason?: string
}

export type ToolAuthorizer = (
  definition: ToolDefinition,
  call: ToolCall,
) => Promise<ToolAuthorizationDecision>

export interface ToolAuditEvent {
  traceId: string
  accountId: string
  userId: string | null
  tool: string
  risk: ToolRisk
  allowed: boolean
  ok: boolean
  reason?: string
}

export type ToolAuditSink = (event: ToolAuditEvent) => Promise<void> | void

/**
 * Canonical AI action boundary.
 *
 * LangGraph nodes must call tools through this gateway rather than calling
 * arbitrary APIs/DB clients directly. Authorization is evaluated before
 * execution and every attempt can be audited. The gateway intentionally
 * contains no LLM logic.
 */
export class ToolGateway {
  private readonly tools = new Map<string, ToolDefinition>()

  constructor(
    private readonly authorize: ToolAuthorizer,
    private readonly audit: ToolAuditSink = () => undefined,
  ) {}

  register<I, O>(definition: ToolDefinition<I, O>) {
    if (this.tools.has(definition.name)) {
      throw new Error(`Tool already registered: ${definition.name}`)
    }
    this.tools.set(definition.name, definition as ToolDefinition)
    return this
  }

  list() {
    return [...this.tools.values()].map(({ name, description, risk }) => ({
      name,
      description,
      risk,
    }))
  }

  async execute<I = unknown, O = unknown>(
    call: ToolCall<I>,
  ): Promise<ToolResult<O>> {
    const definition = this.tools.get(call.name)
    if (!definition) {
      return { ok: false, error: `Unknown tool: ${call.name}` }
    }

    const decision = await this.authorize(definition, call as ToolCall)
    if (!decision.allowed) {
      await this.audit({
        traceId: call.context.traceId,
        accountId: call.context.accountId,
        userId: call.context.userId,
        tool: definition.name,
        risk: definition.risk,
        allowed: false,
        ok: false,
        reason: decision.reason ?? 'denied_by_policy',
      })
      return { ok: false, error: decision.reason ?? 'Tool call denied by policy' }
    }

    let result: ToolResult<O>
    try {
      result = (await definition.execute(call as ToolCall)) as ToolResult<O>
    } catch (error) {
      result = {
        ok: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      }
    }

    await this.audit({
      traceId: call.context.traceId,
      accountId: call.context.accountId,
      userId: call.context.userId,
      tool: definition.name,
      risk: definition.risk,
      allowed: true,
      ok: result.ok,
      reason: result.error,
    })

    return result
  }
}
