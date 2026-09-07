---
Document ID: WA-GOV-AUDIT-002
Title: Phase 0 Public API, Rate-Limit and AI/RAG Fit-Gap Audit
Version: 1.0
Status: IN_REVIEW
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related ADRs: ADR-004, ADR-005, ADR-007, ADR-008, ADR-009, ADR-010, ADR-011
---
# Phase 0 — Public API, Rate-Limit and AI/RAG Fit-Gap Audit

## Scope

Read-only inspection of the pinned WACRM source. No application-source remediation is authorized by this audit.

## Public API / MCP foundation

### WA-AUDIT-201 — API key generation/storage is suitable foundation
**Severity:** POSITIVE / KEEP

The current API key design uses 32 cryptographically random bytes, exposes plaintext once, stores a SHA-256 digest for equality lookup, maintains a non-secret display prefix, and supports revocation/expiry. This is appropriate for high-entropy machine credentials.

### WA-AUDIT-202 — API keys establish an account context with scopes
**Severity:** POSITIVE / KEEP/EXTEND

`requireApiKey` resolves the hashed key to one account, applies per-key rate limiting and scope checks, and returns an API context. Example v1 routes explicitly filter business queries by `ctx.accountId`.

### WA-AUDIT-203 — Public API privileged access relies on query discipline
**Severity:** HIGH

The public API intentionally uses the Supabase service-role client because machine callers have no Supabase user session. RLS is therefore bypassed and every downstream data query must explicitly constrain itself to `ctx.accountId`.

**Risk:** one future endpoint that forgets the tenant predicate can become a cross-tenant data path.

**Target:** retain the API-key/scopes model, but centralize tenant-safe repository/query helpers where practical, require tenant-scope code review rules, and add contract tests that attempt cross-tenant object IDs on every privileged API/tool operation.

### WA-AUDIT-204 — MCP is a useful integration surface, not an authority boundary
**Severity:** POSITIVE / EXTEND

The existing MCP/public API groundwork is useful for external tools. In our target architecture, MCP must sit behind the same tenant, permission, Tool Gateway, audit and approval rules as REST integrations. An MCP tool is not allowed to bypass the canonical Tool Contract.

## Rate limiting / distributed operation

### WA-AUDIT-205 — Current limiter is process-local
**Severity:** HIGH / BLOCKING FOR HORIZONTAL SAAS

`src/lib/rate-limit.ts` explicitly implements a process-local `Map` fixed-window limiter and documents that horizontal scale, multi-region deployments and Vercel/serverless fan-out can defeat it.

This limiter currently protects public API calls, message sends, broadcasts, admin actions and AI draft/auto-reply budgets.

**Impact:** it is useful for local/single-node template deployments but cannot be the production enforcement mechanism for our scalable SaaS or for hard AI cost limits.

**Action:** CR-003.

## Existing AI runtime

### WA-AUDIT-206 — Deterministic responders win over LLM
**Severity:** POSITIVE / KEEP

Current auto-reply intentionally stands down when deterministic flows/automations own the response. This aligns with our architecture rule that deterministic software should handle deterministic work.

### WA-AUDIT-207 — Current auto-reply performs one generation call
**Severity:** POSITIVE / KEEP PRINCIPLE

`generateReply` dispatches one provider call to the configured OpenAI or Anthropic adapter. There is no recursive multi-agent loop. This matches our cost/control philosophy.

### WA-AUDIT-208 — Human handoff and reply-cap controls exist
**Severity:** POSITIVE / KEEP/EVOLVE

Current auto-reply respects human assignment, supports sticky auto-reply disablement, produces handoff summaries, uses an atomic DB RPC to claim a reply slot, and logs usage.

### WA-AUDIT-209 — Prompt contains useful anti-hallucination/injection rules
**Severity:** POSITIVE / KEEP/EVOLVE

The fixed prompt tells the model not to invent prices/order numbers/availability/promises, treats customer messages as untrusted content, ignores attempts to change its role, and marks retrieved knowledge as reference rather than instructions.

These are good baseline controls but do not replace tool authorization, structured output validation, retrieval provenance, action approval or adversarial evaluation.

### WA-AUDIT-210 — Current provider routing is not our target AI Gateway
**Severity:** HIGH / ARCHITECTURE GAP

Current generation supports an account-selected OpenAI or Anthropic adapter. It does not yet implement our governed provider-neutral gateway with per-workflow policy, fallback rules, model allow-lists, tenant/provider constraints, structured telemetry and runtime call-budget enforcement.

**Target:** preserve adapter code where useful but route it behind our canonical AI Gateway.

### WA-AUDIT-211 — Handoff protocol is text-sentinel based
**Severity:** MEDIUM

Current auto-reply asks the model to emit `[[HANDOFF]]` and parses that marker from free text. The prompt defends against customer attempts to force the control phrase, but free-text control signals are weaker than schema-validated structured output.

**Target:** use structured response/action proposals such as `{reply, actionProposals, handoff, reason, confidence}` validated before any business action.

## Knowledge/RAG

### WA-AUDIT-212 — Hybrid retrieval degrades gracefully
**Severity:** POSITIVE / KEEP PATTERN

Knowledge retrieval is semantic-primary when embeddings are configured and tops up/falls back to lexical full-text search. Failed semantic indexing still leaves lexically searchable chunks. Retrieval failure does not break the customer reply path.

### WA-AUDIT-213 — Embeddings implementation is OpenAI-specific and dimension-locked
**Severity:** HIGH / ARCHITECTURE GAP

The current implementation hardcodes OpenAI's embeddings endpoint, `text-embedding-3-small`, and 1536 dimensions tied to the DB vector column.

**Target:** provider-neutral embedding/index configuration with explicit model/version/dimension metadata and a controlled reindex/migration strategy.

### WA-AUDIT-214 — Retrieval output lacks provenance/freshness/authority metadata
**Severity:** HIGH

Current retrieval returns `string[]` excerpts. The generation path therefore receives numbered text snippets but not canonical source ID, document title/version, authority, effective date, freshness, tenant/employee scope, or retrieval score.

**Impact:** insufficient for enterprise evidence, explainability, conflict handling and auditable AI Employees.

**Target:** retrieve structured evidence objects and carry source provenance through context assembly, AI run telemetry and user-visible/audit evidence where appropriate.

### WA-AUDIT-215 — Knowledge is tenant/account-wide, not AI-Employee scoped
**Severity:** HIGH / PRODUCT GAP

Current KB rows are account-owned. Our target needs tenant-wide collections plus optional AI Employee/role/case scopes and explicit allowed-source policies.

### WA-AUDIT-216 — No governed tool/action loop in current AI reply
**Severity:** HIGH / PRODUCT GAP

The current AI reply can reason over conversation + KB and generate/handoff, but it does not implement the Tool Gateway/action proposal workflow required for appointment booking, CRM updates, order lookups, inventory checks, etc.

**Target:** this is where CrewClaw-style permissions/evidence and OpenHire-style skills are selectively adapted into our own bounded runtime rather than replacing it wholesale.

## Fit decision

| Imported capability | Decision |
|---|---|
| API key entropy/hash/revoke/expiry | KEEP |
| API scopes | KEEP / EXTEND |
| service-role public API pattern | KEEP only behind stricter tenant-safe repository/contracts |
| MCP surface | KEEP / put behind Tool Gateway |
| process-local rate limiter | REPLACE for scalable production |
| deterministic-first AI routing | KEEP |
| one-call generation behavior | KEEP principle |
| provider adapters | KEEP candidates behind AI Gateway |
| handoff support | KEEP / convert control output to structured schema |
| AI usage logging | KEEP / EXTEND to cost + workflow telemetry |
| hybrid semantic + lexical retrieval | KEEP pattern |
| OpenAI-only embeddings + 1536 schema lock | REFACTOR |
| text-only retrieval without provenance | REFACTOR |
| account-wide AI config | REPLACE/EVOLVE into AI Employee versions |
| tool-less AI reply | EXTEND with governed Tool Gateway |

## Conclusion

WACRM already contains useful low-level AI, API and knowledge primitives and, importantly, avoids uncontrolled agent loops. We should reuse those compatible primitives. The differentiation layer still must be built: AI Employees, skills, tools, permission/evidence contracts, provider-neutral AI/embedding gateway, structured outputs, provenance, distributed budgets and enterprise evaluation/audit.

**Production remains NO_GO.**
