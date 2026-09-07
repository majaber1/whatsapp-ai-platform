---
Document ID: WA-ARCH-FIT-001
Title: Imported Foundation Capability Disposition
Version: 1.0
Status: IN_REVIEW
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related ADRs: ADR-001..ADR-011
Related CRs: CR-001, CR-002, CR-003
---
# Imported Foundation Capability Disposition

This matrix is the current architecture disposition for the WACRM foundation and the selected CrewClaw/OpenHire adaptations. It does not claim implementation completion.

Statuses:
- **KEEP** — retain the imported capability with verification.
- **EXTEND** — retain the foundation and add target behavior.
- **REFACTOR** — preserve business intent/data where possible but change implementation/design.
- **REPLACE** — imported design does not satisfy the target and should be superseded.
- **ADD** — target capability does not materially exist in the foundation.
- **SELECTIVE_ADAPT** — use approved open-source concepts/components, not the full upstream runtime.

| Domain / capability | Source | Disposition | Target note |
|---|---|---|---|
| Next.js/React application shell | WACRM | KEEP | retain unless later evidence justifies framework change |
| Supabase/PostgreSQL foundation | WACRM | KEEP / EXTEND | PostgreSQL remains transactional truth; verify migrations/RLS |
| Account entity | WACRM | KEEP / EVOLVE | canonical tenant aggregate; naming finalized in Phase 1 LLD |
| User ↔ account membership | WACRM | REFACTOR | many-to-many tenant memberships; CR-002 |
| owner/admin/agent/viewer roles | WACRM | KEEP / EXTEND | tenant membership roles + finer permissions/capabilities |
| RLS groundwork | WACRM | KEEP / EXTEND | complete tenant matrix + cross-tenant E2E |
| One WhatsApp config per account | WACRM | REFACTOR | multiple connections/numbers per tenant; CR-002 |
| Provider phone-number routing | WACRM | KEEP | authoritative inbound routing invariant |
| Meta webhook signature verification | WACRM | KEEP | fail-closed HMAC on raw body |
| Webhook fast ACK + `after()` processing | WACRM | KEEP / VERIFY | validate deployment runtime guarantees |
| Provider-message status identity | WACRM | REFACTOR | tenant/connection scoped identity; CR-001 |
| Access/verify token AES-GCM encryption | WACRM | KEEP / EXTEND | add formal key lifecycle/rotation/secret management |
| Meta credential validation/registration | WACRM | KEEP / EXTEND | adapt to multi-connection model |
| Shared Inbox | WACRM | KEEP / EXTEND | add AI Employee routing/evidence/approval UX |
| Messages/conversations | WACRM | KEEP / EXTEND | preserve data while making provider identity tenant-safe |
| Contacts/tags/custom fields | WACRM | KEEP | extend tenant and AI/tool contracts |
| CRM pipeline/deals | WACRM | KEEP / EXTEND | AI Employee can operate only through governed tools |
| Templates | WACRM | KEEP | preserve Meta policy/lifecycle controls |
| Broadcasts | WACRM | KEEP / EXTEND | add tenant limits, distributed throttling, AI governance where used |
| Flows/automations | WACRM | KEEP / EXTEND | deterministic workflows remain preferred over LLM agents |
| Process-local rate limiter | WACRM | REPLACE for production | distributed atomic control; CR-003 |
| Public API key generation/hash | WACRM | KEEP | high-entropy keys, hash-only storage |
| API scopes | WACRM | KEEP / EXTEND | map to Tool Gateway permissions |
| Service-role public API queries | WACRM | REFACTOR/CONTROL | tenant-safe repositories/contracts + negative tests |
| MCP server | WACRM | KEEP / EXTEND | expose only through canonical Tool Gateway permissions/audit |
| Current account AI config | WACRM | REPLACE/EVOLVE | versioned AI Employees + shared runtime |
| OpenAI/Anthropic generation adapters | WACRM | KEEP candidates | sit behind provider-neutral AI Gateway |
| Deterministic-first AI dispatch | WACRM | KEEP | flows/rules win over LLM where possible |
| One-call reply generation | WACRM | KEEP principle | simple workflow target = 1 LLM call |
| Handoff behavior | WACRM | KEEP / EXTEND | structured handoff reason/evidence/approval |
| Free-text `[[HANDOFF]]` sentinel | WACRM | REFACTOR | schema-validated structured output |
| AI usage logging | WACRM | KEEP / EXTEND | tenant/employee/workflow/model/cost telemetry |
| Account-level AI reply cap | WACRM | KEEP concept | enforce through distributed budget service |
| AI knowledge documents/chunks | WACRM | KEEP / EXTEND | source metadata, version, authority, freshness, scope |
| Hybrid semantic + lexical retrieval | WACRM | KEEP pattern | structured evidence with provenance |
| OpenAI-only embedding adapter | WACRM | REFACTOR | provider-neutral embeddings gateway |
| fixed 1536-vector schema | WACRM | REFACTOR | versioned embedding/index strategy |
| tenant-wide only KB scope | WACRM | EXTEND | tenant + employee + case/source-policy scopes |
| AI Employee contract/profile | CrewClaw + our design | SELECTIVE_ADAPT / ADD | canonical versioned employee definition |
| AI Employee skills | OpenHire + our design | SELECTIVE_ADAPT / ADD | governed skill catalog tied to tools/evals |
| reusable cases/missions | OpenHire concepts | SELECTIVE_ADAPT / ADD | approved reusable work patterns, not uncontrolled prompts |
| employee permissions/boundaries | CrewClaw concepts | SELECTIVE_ADAPT / ADD | deny/allow/approval policy enforced outside LLM |
| Doctor/preflight | CrewClaw concepts | SELECTIVE_ADAPT / ADD | activation checks for model, KB, tools, credentials, budgets |
| task evidence/artifacts | CrewClaw concepts | SELECTIVE_ADAPT / ADD | evidence before task completion/performance claims |
| human approvals | CrewClaw concepts | SELECTIVE_ADAPT / ADD | explicit approval states for high-impact actions |
| employee registry/workspace | OpenHire concepts | SELECTIVE_ADAPT / ADD | tenant-scoped registry and configuration workspace |
| memory lifecycle/versioning | OpenHire concepts | SELECTIVE_ADAPT / ADD | structured approved memory; no silent model-memory truth |
| CrewClaw full runtime | CrewClaw | DO NOT ADOPT wholesale | own controlled shared runtime remains authoritative |
| OpenHire control-agent/worker runtime | OpenHire | DO NOT ADOPT wholesale | no high-iteration or uncontrolled multi-agent default |
| Conversation Agent | Our core | ADD | primary shared reasoning role |
| Safety/Quality Supervisor | Our core | ADD | conditional only |
| Tool Gateway | Our core | ADD | canonical interface for all business actions |
| Integration Gateway | Our core | ADD | adapters, auth, timeout/retry/idempotency/audit |
| structured AI action proposals | Our core | ADD | validate before execution |
| authoritative source-of-truth policy | Our core | ADD / ENFORCE | AI never owns prices/order state/inventory/etc. |
| AI Employee marketplace/templates | Our core | ADD | Saudi/industry templates with controlled versions |
| Salla/Zid/local integrations | Our core | ADD | post-foundation, demand-driven |
| tenant usage metering | Our core | ADD | messages/AI/tools/storage/plan usage |
| SaaS billing/subscriptions | Our core | ADD | provider chosen later; authoritative billing state |
| AI evaluation/evidence | Our core + CrewClaw concepts | ADD | Arabic/Saudi, tools, grounding, handoff, safety, cost |
| governance dashboard | Our core | ADD | driven by `project-governance.json`/evidence |
| enterprise audit trail | Our core | ADD / EXTEND | user, API, tool, AI, approval, config/version events |

## Architecture conclusion

The imported WACRM code is retained as the application/WhatsApp/CRM foundation. We are **not** restarting from zero and **not** converting the repository into a three-runtime mash-up. CrewClaw and OpenHire are selective component/concept sources; our architecture remains the single authority.

Implementation may begin only after the relevant Phase 1 CRs, database migration design, Definition of Ready and test plans are approved.
