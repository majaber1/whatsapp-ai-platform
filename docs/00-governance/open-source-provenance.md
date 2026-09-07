---
Document ID: WA-GOV-OSS-001
Title: Open-Source Provenance Register
Version: 1.0
Status: APPROVED
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related Requirements: WA-FR-*, WA-NFR-*
Related ADRs: ADR-011
Supersedes: None
Change Summary: Pins the reviewed upstream sources selected for the Phase 0 composition strategy.
---
# Open-Source Provenance Register

## Policy

The platform is a new controlled repository. Upstream projects are not blindly merged. Every copied or adapted source component must be attributable to an exact upstream repository and commit, with its original license preserved. Upstream updates are opt-in and require review; `main` must never track an unpinned moving branch as a production dependency.

## Pinned upstreams

| Component | Repository | Pinned commit | License | Approved role |
|---|---|---|---|---|
| WACRM | https://github.com/ArnasDon/wacrm | `98b5bd26e8feacacfd4b74ff58411acb8154d212` | MIT | Application foundation for official Meta WhatsApp connectivity, inbox, contacts, CRM/pipeline, broadcasts/templates/flows, existing API/security primitives. |
| CrewClaw | https://github.com/staruhub/CrewClaw | `9e456e51064580bab3206d0e837018cfafdb7962` | Apache-2.0 | Employee-contract, permissions, Doctor/preflight, evidence, approval, task-event, KPI/performance patterns/components after compatibility review. |
| OpenHire | https://github.com/pzy2000/OpenHire | `17842144d0efc2f0661c00bb28b38d62ba331199` | MIT | Employee registry, skills/cases, memory versioning, provider/workspace/admin-observability patterns/components after compatibility review. |

## Adoption boundary

### WACRM

Adoption mode: **foundation import completed** into `majaber1/whatsapp-ai-platform` at the pinned baseline commit. Further changes occur only through governed branches/PRs.

Retain where architecture-compatible:
- official Meta Cloud API integration
- webhook/signature/security primitives
- inbox/messages
- contacts/tags/custom fields
- account/RLS groundwork
- CRM/pipeline
- templates/broadcasts
- flows/automation groundwork
- API/MCP groundwork

Do not assume its current account model satisfies our final SaaS tenancy model.

### CrewClaw

Adoption mode: **selective adaptation**, not wholesale runtime dependency in v1.

Prefer:
- employee contract model
- permission/capability boundaries
- preflight/Doctor concept
- evidence-first task completion
- human approval checkpoints
- KPI/performance derived from run evidence

Do not automatically inherit beta runtime orchestration or future sub-agent behavior.

### OpenHire

Adoption mode: **selective adaptation**, not wholesale control-agent runtime.

Prefer:
- employee registry
- skill catalog
- reusable cases
- memory lifecycle/versioning
- provider abstraction concepts
- admin/runtime inspection concepts

Explicitly reject unbounded/high-iteration control-agent behavior as the default runtime for this product.

## Licensing controls

1. Keep original license notices for copied/adapted code.
2. Maintain `THIRD-PARTY-NOTICES.md` and `OPEN-SOURCE-INVENTORY.md`.
3. Audit transitive dependency licenses before production.
4. Record copied file provenance when code is imported.
5. Do not copy Peach or other closed-source proprietary source/assets/branding.
6. New upstream versions require review and a controlled update decision.

## Import evidence — 2026-09-07

- Destination repository: `majaber1/whatsapp-ai-platform`
- Destination default branch: `main`
- Imported baseline commit: `98b5bd26e8feacacfd4b74ff58411acb8154d212`
- Imported baseline tree: `dd56c28443b57949685fd852ff94e973a17c692e`
- Repository metadata confirms the imported baseline is MIT-licensed and currently public.
- No product source code has been changed by our governance bootstrap at this checkpoint.
