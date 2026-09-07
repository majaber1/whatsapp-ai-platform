---
Document ID: CR-001
Title: Tenant-Safe Provider Message Identity and Status Routing
Version: 1.0
Status: PROPOSED
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related ADRs: ADR-002, ADR-004, ADR-011
Related Audit Findings: WA-AUDIT-103, WA-AUDIT-104, WA-AUDIT-106
---
# CR-001 — Tenant-Safe Provider Message Identity and Status Routing

## Problem

The imported WACRM webhook status handler updates `messages` by provider `message_id` alone, and broadcast recipient status lookup also relies on `whatsapp_message_id` alone. The webhook receives `metadata.phone_number_id`, but status processing does not carry that authoritative channel context into these updates.

The current messages schema has a non-unique index on `message_id`, not a tenant/provider-channel scoped identity constraint.

## Risk

Before multi-tenant production this creates an unacceptable cross-tenant data-integrity ambiguity whenever a provider message identifier is not globally unique across all configured phone numbers or whenever historic/duplicate data contains the same identifier.

## Proposed target

Canonical provider-message identity must include authoritative channel ownership, for example:

`tenant_id + whatsapp_connection_id/phone_number_id + provider_message_id`

The exact relational design must be finalized in LLD/DB design before implementation.

Status webhook processing must:

1. Resolve the connection/tenant from webhook `metadata.phone_number_id`.
2. Scope message and broadcast-recipient lookup/update to that connection/tenant.
3. Reject ambiguous ownership rather than update multiple tenant namespaces.
4. Preserve forward-only status transitions.
5. Preserve webhook idempotency.

## Required implementation artifacts

- DB migration design and backfill plan
- unique/index strategy
- updated webhook status contract
- broadcast-recipient identity update
- tenant-safe service-role helper
- rollback plan
- migration tests
- duplicate/collision tests
- cross-tenant negative tests
- webhook replay tests
- live Meta status E2E before G8 close

## Migration impact

Potential changes to `messages`, `broadcast_recipients`, `whatsapp_config`/future connection table and status handler queries. Existing records need deterministic ownership derivation through conversation/account/channel relationships; records that cannot be safely resolved must not be guessed.

## Security impact

Positive: removes a privileged cross-tenant ambiguity in a service-role webhook path.

## Cost impact

Expected low/UNKNOWN until query/index design is benchmarked.

## Rollback

Must be designed before implementation. Rollback must not discard new provider identity information or recreate ambiguous cross-tenant update behavior.

## Decision

**PROPOSED — BLOCKING for multi-tenant production readiness, not blocking Phase 0 audit.**
