# Phase 0 — Foundation Baseline Report

**Date:** 2026-09-07  
**Status:** IN_PROGRESS  
**Production:** NO_GO

## Completed in this checkpoint

- WACRM source imported into `majaber1/whatsapp-ai-platform`.
- Imported `main` verified at commit `98b5bd26e8feacacfd4b74ff58411acb8154d212`.
- Imported tree verified at `dd56c28443b57949685fd852ff94e973a17c692e`.
- Repository remains an independent import (`fork=false`) and currently public.
- WACRM package baseline verified as `wacrm` v0.8.0, Node >=20, npm 10.9.9, Next.js 16.2.12, React 19.2.4, Supabase client stack, TypeScript 6 and Vitest.
- Universal governance standard installed.
- ADR-011 ACCEPTED for controlled WACRM + CrewClaw + OpenHire composition.
- Exact upstream commits and top-level licenses locked.
- WACRM tenancy gap documented from migrations 017/018/020.
- Governance bootstrap is isolated on `governance/phase0-baseline`; no product source change is authorized in this checkpoint.

## Pinned upstreams

- WACRM: `98b5bd26e8feacacfd4b74ff58411acb8154d212` — MIT — imported foundation.
- CrewClaw: `9e456e51064580bab3206d0e837018cfafdb7962` — Apache-2.0 — selective adaptation only.
- OpenHire: `17842144d0efc2f0661c00bb28b38d62ba331199` — MIT — selective adaptation only.

## Source/build status

Source presence is not build evidence. At this checkpoint:

- dependency install: NOT_RUN
- typecheck: NOT_RUN
- lint: NOT_RUN
- build: NOT_RUN
- unit tests: NOT_RUN
- application runtime: NOT_RUN
- browser verification: NOT_RUN
- Supabase migration execution: NOT_RUN
- production WhatsApp integration: NOT_RUN
- live E2E: NOT_RUN

No PASS status is inferred from repository inspection alone.

## Confirmed architecture gaps from imported source

1. WACRM tenancy is account-scoped, but membership is explicitly one-account-per-user via `profiles.account_id`.
2. `whatsapp_config` explicitly allows one WhatsApp configuration/number per account.
3. WACRM AI is one account-level AI reply configuration rather than our multi-employee, versioned AI Employee model.
4. WACRM knowledge/RAG and API/MCP foundations are useful retained capabilities but require target-architecture reconciliation.

## Next checkpoint

1. Open a Draft PR for this docs-only Phase 0 baseline.
2. Let existing GitHub CI run dependency install, lint, typecheck, tests and build on the imported foundation plus docs.
3. Record CI evidence without fixing failures in this audit phase.
4. Continue schema/migrations/RLS, Meta webhook/auth/token, API/MCP and security audit.
5. Produce KEEP / EXTEND / REFACTOR / REPLACE capability map.
6. Freeze ARCH-1.0 only after executable evidence supports it.
