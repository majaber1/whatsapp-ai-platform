---
Document ID: WA-GOV-AUDIT-001
Title: Phase 0 Imported WACRM Source Audit
Version: 1.0
Status: IN_REVIEW
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related ADRs: ADR-002, ADR-004, ADR-005, ADR-007, ADR-011
---
# Phase 0 Imported WACRM Source Audit

## Scope

Read-only audit of the imported WACRM application foundation at:

`98b5bd26e8feacacfd4b74ff58411acb8154d212`

No application-source remediation is authorized in this Phase 0 checkpoint.

## Executable baseline evidence

GitHub Actions run `34088726801`, job `101637732639`, on Draft PR #1 completed SUCCESS:

- checkout: PASS
- Node setup: PASS
- `npm ci`: PASS
- lint: PASS
- typecheck: PASS
- unit tests: PASS
- Next.js build: PASS

This is CI/build evidence only. It is not database, browser, live Meta, integration, security, load, or production E2E evidence.

## Positive findings — retain/extend

### WA-AUDIT-001 — Meta webhook signature verification
**Severity:** POSITIVE / KEEP

The POST webhook reads the raw body before JSON parsing, reads `x-hub-signature-256`, and calls a dedicated HMAC-SHA256 verifier. `META_APP_SECRET` fails closed when absent. Signature comparison uses `crypto.timingSafeEqual` after a length check.

**Decision:** KEEP, with tests preserved.

### WA-AUDIT-002 — Serverless-safe webhook post-processing
**Severity:** POSITIVE / KEEP

The route ACKs Meta quickly and schedules processing through Next.js `after()` instead of a detached promise, reducing message-loss risk on serverless freeze/termination.

**Decision:** KEEP and reverify on our chosen deployment target.

### WA-AUDIT-003 — Credential encryption uses authenticated encryption
**Severity:** POSITIVE / KEEP/EXTEND

Current token writes use AES-256-GCM with 12-byte IV and authentication tag. Legacy CBC ciphertext remains decrypt-only and can be upgraded. Access and verify tokens are encrypted before DB storage.

**Decision:** KEEP initially. Before production, move key lifecycle/rotation and secret management under the platform security architecture.

### WA-AUDIT-004 — Credentials validated against Meta before save
**Severity:** POSITIVE / KEEP

Configuration save verifies the phone-number access token against Meta before persistence, checks cross-account `phone_number_id` claims through the service role, performs optional number registration and WABA subscription, and persists registration diagnostic state.

**Decision:** KEEP/EXTEND for multi-number tenancy.

### WA-AUDIT-005 — Inbound phone routing is explicit
**Severity:** POSITIVE / KEEP/EXTEND

Inbound messages route through `metadata.phone_number_id`, then resolve exactly one `whatsapp_config`. Zero or multiple configurations are rejected/logged instead of guessing ownership.

**Decision:** KEEP the provider-identifier routing invariant while replacing the one-config-per-account restriction.

### WA-AUDIT-006 — Current AI path is bounded and subordinate to deterministic flows
**Severity:** POSITIVE / KEEP CONCEPT

The current WACRM AI auto-reply path explicitly lets deterministic flows win, respects human ownership/handoff, applies per-account rate limiting, retrieves account knowledge, makes one configured provider generation call, logs token usage, and atomically claims a per-conversation reply slot before sending.

**Decision:** Preserve the deterministic-first and bounded-call properties, but replace the account-level AI config with the governed AI Employee/runtime model.

## Gaps / risks

### WA-AUDIT-101 — One active account membership per user
**Severity:** HIGH

WACRM stores active membership and role on `profiles.account_id/account_role`. A user cannot naturally hold memberships in multiple tenants.

**Impact:** Does not meet target SaaS membership model.

**Action:** CR-002 before Phase 1 implementation.

### WA-AUDIT-102 — One WhatsApp config/number per account
**Severity:** HIGH

`whatsapp_config` currently has a one-row-per-account constraint and the API resolves with `maybeSingle()`.

**Impact:** Target tenants cannot own multiple WhatsApp numbers/connections.

**Action:** CR-002 before Phase 1 implementation.

### WA-AUDIT-103 — Message status update is not tenant/phone scoped
**Severity:** CRITICAL

The webhook status handler updates `messages.status` using only:

`messages.message_id = status.id`

The messages schema indexes `message_id` but does not make it a tenant-scoped unique key. The handler itself explicitly documents that a Meta ID may repeat across numbers and therefore intentionally updates 0..N rows.

The status-processing function is also called without carrying the webhook's `metadata.phone_number_id` or resolved tenant/config context.

**Risk:** A delivery/read/failed status event can update the wrong message rows if the same provider message ID exists in more than one phone-number/tenant namespace. At minimum this is a cross-tenant data-integrity weakness; it must be removed before multi-tenant production.

**Action:** CR-001. Introduce canonical provider-message identity scoped to the owning channel/phone/tenant, route status events with provider account context, add DB uniqueness/indices, migration/backfill strategy, and failure/E2E tests.

### WA-AUDIT-104 — Broadcast recipient status lookup is also provider-ID only
**Severity:** HIGH

Broadcast recipient lookup uses `whatsapp_message_id` without tenant/phone context before `maybeSingle()`.

**Risk:** Ambiguous provider IDs can break or misroute status aggregation.

**Action:** Include in CR-001.

### WA-AUDIT-105 — Webhook GET verify-token lookup scans every WhatsApp config
**Severity:** MEDIUM

Webhook subscription verification loads all `whatsapp_config` rows, decrypts candidate verify tokens and looks for a match.

**Risk:** O(N) verification path and unnecessary access to every tenant's encrypted verify token in one request. It becomes increasingly undesirable at SaaS scale.

**Action:** Reassess verify-token strategy under the multi-number Meta app design. Prefer an app/environment-level verification secret or another O(1) governed mapping where compatible with Meta's subscription model.

### WA-AUDIT-106 — Service-role usage requires stricter tenant-context discipline
**Severity:** HIGH

Webhook/config paths legitimately use Supabase service-role clients to cross RLS for routing/ownership checks. Service role bypasses RLS by design.

**Risk:** Any future caller-supplied tenant/account/phone identifier used without an authoritative lookup could become a cross-tenant write path.

**Action:** The target Tool/Channel Gateway must resolve tenant context from authoritative provider identifiers, never trust a model/user-supplied tenant id in privileged channel handlers, and must have dedicated cross-tenant tests.

### WA-AUDIT-107 — Current AI configuration is account-level, not employee-level
**Severity:** HIGH / PRODUCT ARCHITECTURE GAP

Current WACRM AI selects one provider/model/system prompt for the account. It is an AI reply assistant/auto-reply, not a versioned employee registry with skill/tool/permission/evaluation contracts.

**Action:** REPLACE/EVOLVE in the AI Employee phase while retaining useful provider adapters, retrieval, handoff, rate-limit and usage-metering primitives where compatible.

## KEEP / EXTEND / REFACTOR / REPLACE summary

| Capability | Decision |
|---|---|
| Meta webhook signature verification | KEEP |
| Meta credential verification | KEEP |
| AES-GCM token encryption | KEEP then EXTEND with key management |
| `after()` webhook processing | KEEP subject to deployment validation |
| phone-number-based inbound routing | KEEP invariant / EXTEND model |
| inbox/messages/contacts | KEEP / tenant-safety verification |
| account RLS groundwork | KEEP / REFACTOR membership model |
| one-account-per-user membership | REFACTOR |
| one-WhatsApp-config-per-account | REFACTOR |
| message/broadcast status identity | REFACTOR before multi-tenant production |
| flows/automations deterministic-first | KEEP / EXTEND |
| current AI provider adapters | KEEP candidate |
| current account AI config | REPLACE/EVOLVE |
| current RAG/knowledge primitives | KEEP / EXTEND with employee scopes/provenance |
| CrewClaw/OpenHire full runtimes | DO NOT IMPORT wholesale |

## Current conclusion

The WACRM source is a viable **foundation candidate**: its CI baseline is healthy and several channel/security/reliability primitives are worth retaining. It is **not yet safe to freeze as our production architecture** because tenant membership, multi-number ownership and provider-message status identity require controlled Phase 1 changes and live database/Meta/browser evidence is still absent.

**Production: NO_GO.**
