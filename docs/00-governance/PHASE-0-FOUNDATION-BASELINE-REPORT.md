# Phase 0 — Foundation Baseline Report

**Date:** 2026-09-07  
**Status:** IN_PROGRESS  
**Production:** NO_GO

## Completed in this checkpoint

- WACRM source imported into `majaber1/whatsapp-ai-platform`.
- Imported `main` verified at commit `98b5bd26e8feacacfd4b74ff58411acb8154d212`.
- Imported tree verified at `dd56c28443b57949685fd852ff94e973a17c692e`.
- Repository remains an independent import (`fork=false`) and was PUBLIC at baseline.
- WACRM package baseline verified as `wacrm` v0.8.0, Node >=20, npm 10.9.9, Next.js 16.2.12, React 19.2.4, Supabase client stack, TypeScript 6 and Vitest.
- Universal governance standard installed.
- ADR-011 ACCEPTED for controlled WACRM + CrewClaw + OpenHire composition.
- Exact upstream commits and top-level licenses locked.
- WACRM tenancy gap documented from migrations 017/018/020.
- Canonical AI Employee and Tool Gateway schemas added as governed contracts.
- Draft PR #1 opened from `governance/phase0-baseline` to `main`.
- Source audit recorded in `source-audit-phase0.md`.
- CR-001 proposed for tenant-safe provider-message identity/status routing.
- CR-002 proposed for many-to-many tenant memberships and multiple WhatsApp connections.
- Governance bootstrap remains isolated from product source; no WACRM application-source remediation is authorized in this checkpoint.

## Pinned upstreams

- WACRM: `98b5bd26e8feacacfd4b74ff58411acb8154d212` — MIT — imported foundation.
- CrewClaw: `9e456e51064580bab3206d0e837018cfafdb7962` — Apache-2.0 — selective adaptation only.
- OpenHire: `17842144d0efc2f0661c00bb28b38d62ba331199` — MIT — selective adaptation only.

## Executable CI baseline

GitHub Actions run `34088726801`, job `101637732639` completed SUCCESS:

- dependency install: PASS
- lint: PASS
- typecheck: PASS
- unit tests: PASS
- Next.js build: PASS

A later CI run may execute again as documentation commits are appended to the same Draft PR. The above run is the first completed executable baseline evidence.

## Still not verified

- Supabase migrations in our own environment: NOT_RUN
- RLS/cross-tenant database E2E: NOT_RUN
- application browser E2E: NOT_RUN
- real Meta WhatsApp connection: NOT_RUN
- real inbound/outbound WhatsApp E2E: NOT_RUN
- AI Employee runtime: NOT_IMPLEMENTED
- AI evaluation: NOT_STARTED
- security/failure/load tests: NOT_STARTED
- production smoke: NOT_STARTED

CI/build success must not be interpreted as live integration or production readiness.

## Confirmed architecture gaps/findings

1. WACRM tenancy is account-scoped, but membership is explicitly one-account-per-user via `profiles.account_id`.
2. `whatsapp_config` explicitly allows one WhatsApp configuration/number per account.
3. Message/broadcast status processing relies on provider message IDs without carrying tenant/phone context; this is a blocking tenant-safety/data-integrity issue for our multi-tenant production target and is captured by CR-001.
4. WACRM AI is one account-level AI reply configuration rather than our multi-employee, versioned AI Employee model.
5. WACRM Meta webhook HMAC verification, AES-GCM token encryption, fast ACK/`after()` processing, deterministic-flow priority, bounded AI generation and usage logging are useful foundations to KEEP/EXTEND.
6. WACRM knowledge/RAG and API/MCP foundations are useful retained capabilities but require target-architecture reconciliation.

## Next checkpoint

1. Complete schema/RLS/service-role tenant-safety audit.
2. Complete Meta send/config/token lifecycle and error/retry audit.
3. Complete public API/MCP authorization audit.
4. Complete existing AI/RAG capability fit-gap against the AI Employee contract.
5. Produce final KEEP / EXTEND / REFACTOR / REPLACE map.
6. Design CR-001 and CR-002 implementation/migration/test plans for Phase 1.
7. Run database + browser + live WhatsApp verification when test environment/Meta credentials are available.
8. Freeze ARCH-1.0 only after the Phase 0 exit evidence is complete.
