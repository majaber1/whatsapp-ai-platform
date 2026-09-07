---
Document ID: WA-GOV-BASE-001
Title: Current State Baseline — Imported WACRM Foundation
Version: 1.0
Status: IN_REVIEW
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related ADRs: ADR-001, ADR-002, ADR-003, ADR-004, ADR-011
---
# Current State Baseline — Imported WACRM Foundation

## Repository evidence

- Repository: `majaber1/whatsapp-ai-platform`
- Default branch: `main`
- Imported baseline commit: `98b5bd26e8feacacfd4b74ff58411acb8154d212`
- Baseline tree: `dd56c28443b57949685fd852ff94e973a17c692e`
- Import source: `ArnasDon/wacrm`
- GitHub import relationship: independent repository, not a GitHub fork
- Visibility at baseline: PUBLIC
- License detected at repository level: MIT
- Branch protection at baseline: not enabled

## Runtime/toolchain evidence

From the imported `package.json`:

- package: `wacrm`
- version: `0.8.0`
- Node: `>=20.0.0`
- package manager: `npm@10.9.9`
- Next.js: `16.2.12`
- React: `19.2.4`
- TypeScript: `^6`
- Supabase JS: `^2.107.0`
- Supabase SSR: `^0.12.0`
- tests: Vitest
- lint: ESLint

## Repository capabilities visible from source tree

The imported source contains application code, Supabase migrations, CI workflows, Docker support, public API documentation, MCP server code and the existing WACRM product modules. These are implementation evidence only; none is classified as live-verified merely from file presence.

## Database state

- Technology: PostgreSQL/Supabase by upstream design.
- Migrations directory exists under `supabase/migrations/`.
- Migration execution against our own environment: NOT_RUN.
- RLS runtime verification: NOT_RUN.
- Cross-tenant E2E isolation: NOT_RUN.

## Product status

The imported WACRM application is the selected commodity foundation, not the final WhatsApp AI Platform. Our target additions include true SaaS membership/tenant governance, canonical AI Employee contracts, controlled AI runtime, Tool/Integration Gateway, knowledge governance, metering/billing, Saudi/Arabic product behavior, AI evaluation/audit and enterprise governance.

## Verification status

- dependency install: NOT_RUN
- typecheck: NOT_RUN
- lint: NOT_RUN
- unit tests: NOT_RUN
- build: NOT_RUN
- local runtime: NOT_RUN
- browser E2E: NOT_RUN
- Meta live integration: NOT_RUN
- production readiness: NO_GO

This document records current evidence only and must not be interpreted as approval of the imported implementation.
