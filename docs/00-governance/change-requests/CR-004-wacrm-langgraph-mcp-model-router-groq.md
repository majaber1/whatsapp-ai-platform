---
Document ID: WA-CR-004
Title: Adopt WACRM + LangGraph + MCP Tool Gateway + Model Router + Groq
Status: APPROVED
Approved: 2026-09-09
Related ADR: ADR-012
---

# CR-004 — AI Runtime Architecture Adoption

## Requested change

Adopt and implement the following controlled architecture without replacing the WACRM application foundation:

- WACRM / Next.js — application, WhatsApp, CRM and deterministic automation foundation.
- LangGraph — bounded AI Employee orchestration and state machine.
- Tool Gateway — canonical authorization, policy, audit and execution boundary.
- MCP — integration protocol supported behind the Tool Gateway; reuse the existing WACRM MCP server.
- Model Router — deterministic provider/model dispatch and future fallback policy.
- Groq — supported model provider alongside OpenAI and Anthropic.
- Supabase — authoritative application/tenant/knowledge/audit state.

## Reason

The existing AI reply assistant directly switches between OpenAI and Anthropic and has no stateful AI Employee orchestration or canonical tool-action boundary. The product vision requires governed AI Employees while preserving the proven WACRM operational layer.

## Scope in this change

1. Record ADR-012 as the approved architecture.
2. Introduce Groq as a first-class `AiProvider` through a provider adapter.
3. Introduce a Model Router module so provider dispatch is no longer embedded in `generateReply`.
4. Introduce a Tool Gateway contract with tenant context, read/write risk classification, explicit authorization hooks and audit metadata.
5. Retain/reuse the existing `mcp-server/` implementation; do not create a duplicate MCP server.
6. Add a bounded LangGraph conversation-runtime scaffold behind `AI_RUNTIME_V2_ENABLED`.
7. Keep current AI reply runtime as the default until E2E verification approves activation.
8. Add migration to extend the persisted AI provider constraint for Groq.
9. Add tests for routing, Groq response normalization and graph call-budget behavior.

## Out of scope

- Enabling unrestricted autonomous agents.
- Removing OpenAI or Anthropic.
- Migrating all current automation flows into LangGraph.
- Direct model access to database service-role credentials.
- Direct model-to-MCP execution that bypasses Tool Gateway controls.
- Full AI Employee Studio UI in this change.
- Production activation before E2E evidence.

## Compatibility constraints

- Existing WACRM inbox/CRM/WhatsApp paths must remain operational.
- Existing AI configuration rows remain valid.
- Existing `mcp-server/` public API scopes and read-only-by-default safety model remain intact.
- Normal AI workflow hard limit remains <=3 LLM calls.
- No production database migration is implied by merge; hosted migration must be explicitly applied and verified.

## Rollback

- Disable `AI_RUNTIME_V2_ENABLED` to return to legacy AI reply path.
- Existing OpenAI/Anthropic configs remain supported.
- Groq migration only broadens the provider CHECK constraint and can be reversed after confirming no Groq rows exist.

## Definition of Done

Code is not considered complete until lint, typecheck, tests and build pass, migration replay passes, and the new runtime is verified with real persistence and provider/tool integration where applicable. Until then production status remains NO_GO for the new AI runtime.
