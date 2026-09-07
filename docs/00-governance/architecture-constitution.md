---
Document ID: WA-GOV-002
Title: Architecture Constitution
Version: 1.1
Status: IN_REVIEW
Owner: Architecture Governance Authority
Created: 2026-09-06
Last Updated: 2026-09-07
Related Requirements: See traceability matrix
Related ADRs: See ADR register
Supersedes: Version 1.0
Change Summary: Makes the Universal Project Governance, Architecture & Delivery Standard v1.0 an explicit governing parent and records current open-source composition controls.
---

# Architecture Constitution

## Governing standard

This project SHALL comply with:

`docs/00-governance/UNIVERSAL-PROJECT-GOVERNANCE-ARCHITECTURE-DELIVERY-STANDARD-v1.0.md`

The Universal Standard is the governing parent for lifecycle, evidence, architecture control, AI limits, security, cost, testing, release and controlled change.

If implementation conflicts with the approved governance/architecture baseline, the implementation is not automatically authoritative. The conflict must be documented and handled through the required ADR and/or Change Request process.

## Controlled architecture rule

Approved architecture is a controlled design contract. Implementation agents and developers may not silently alter:

- architecture style
- service/domain boundaries
- database technology or ownership
- tenancy/membership model
- authentication/authorization
- public API contracts
- WhatsApp provider/channel strategy
- AI model/provider/agent architecture
- AI Employee execution model
- source-of-truth ownership
- Tool/Integration Gateway pattern
- deployment strategy
- security/privacy baseline
- observability
- material recurring cost controls

If a conflict appears:

Evidence → Architecture Compliance Check → Change Request → ADR if architectural → Approval → Implementation → Verification → Baseline update.

## Accepted composition boundary

ADR-011 governs the open-source composition:

- WACRM: WhatsApp/Inbox/CRM/automation application foundation.
- CrewClaw: selectively adapted AI Employee governance concepts/components.
- OpenHire: selectively adapted employee registry/skills/cases/memory concepts/components.
- WhatsApp AI Platform controlled core: canonical tenancy, AI Employee schema/runtime, Tool/Integration Gateway, AI budgets, Saudi/Arabic behavior, metering/billing, evaluation/audit, enterprise governance.

No third-party runtime may silently become the platform control plane.

## Mandatory AI runtime invariant

Default runtime AI roles:

1. Conversation Agent.
2. Conditional Safety/Quality Supervisor.

Router, retrieval/RAG, memory storage, authorization, workflow engine, tool executor and deterministic validators are software components unless a future accepted ADR explicitly changes this classification.

Default workflow budget:

- simple: 1 LLM call
- moderate: <=2 LLM calls
- complex approved: <=3 LLM calls

Unbounded loops are prohibited.

## Mandatory engineering rules

- Prefer deterministic code for deterministic work.
- Prefer an authoritative DB/API query over an LLM for factual business state.
- Prefer a direct tool/workflow over an agent when reasoning is unnecessary.
- Avoid microservices until scale/ownership/failure-boundary evidence justifies extraction.
- No hidden production prompts, tools, model fallbacks or external data sources.
- Customer-visible factual claims that depend on business state must come from an authoritative system or governed/cited tenant knowledge.
- A feature is not done because code, UI or mocks exist; Definition of Done and real persistence/E2E evidence govern completion.
