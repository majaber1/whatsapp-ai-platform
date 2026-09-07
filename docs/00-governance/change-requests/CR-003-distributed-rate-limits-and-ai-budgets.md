---
Document ID: CR-003
Title: Distributed Rate Limits and AI Budget Enforcement
Version: 1.0
Status: PROPOSED
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related ADRs: ADR-005, ADR-007, ADR-010, ADR-011
Related Audit Findings: WA-AUDIT-205
---
# CR-003 — Distributed Rate Limits and AI Budget Enforcement

## Problem

The imported WACRM limiter is an in-memory per-Node-process `Map`. The implementation itself documents that horizontal scale, Vercel/serverless fan-out and multiple regions defeat the configured limits.

The same limiter currently protects public API, WhatsApp sends, broadcasts, admin operations and AI request budgets. It therefore cannot be considered a hard production control for our scalable SaaS.

## Proposed target

Adopt one shared/distributed enforcement mechanism behind the existing limiter interface, selected during deployment architecture approval. Acceptable implementations may include Redis or another managed atomic rate-limit store that satisfies latency, availability, tenant isolation, cost and regional requirements.

The canonical rate/budget service must support at minimum:

- tenant/account bucket
- API key bucket
- user bucket where relevant
- WhatsApp connection/phone bucket where relevant
- AI Employee/workflow bucket
- provider/model bucket where relevant
- LLM-call count ceiling
- tool-call ceiling
- token/cost budget hooks
- deterministic retry semantics
- observable limit decisions

## Required properties

1. Atomic across all running application instances.
2. Explicit failure policy: fail closed for high-risk/cost/security controls where required; documented fallback for low-risk UX throttles.
3. Tenant-scoped keys with no cross-tenant collision.
4. No model or tool can bypass the budget service.
5. Metrics for allowed/rejected requests, remaining budget, errors and backend availability.
6. Load and failure tests before G8/G9 close.

## Migration strategy

Preserve the current call-site contract where practical so the backing implementation can change without rewriting every route. Remove process-local enforcement as the authoritative production control after distributed verification.

## Cost impact

UNKNOWN until deployment provider and traffic assumptions are approved. The cost model must compare managed Redis/equivalent options and expected request volume.

## Decision

**PROPOSED — required before horizontally scaled or serverless production and before AI cost limits are considered enforceable.**
