---
Document ID: GOV-STD-001
Title: Universal Project Governance, Architecture & Delivery Standard
Version: 1.0
Status: APPROVED
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related Requirements: All project requirements
Related ADRs: All project ADRs
Supersedes: None
Change Summary: Consolidated universal governance, architecture, delivery, AI, security, cost, verification, versioning, and change-control standard for all current and future projects.
---

# Universal Project Governance, Architecture & Delivery Standard v1.0

## 1. Purpose

This standard is mandatory for every current and future software, data, AI, automation, SaaS, integration, internal, customer-facing, recovered, or production project governed by this repository.

Its purpose is to make implementation repeatable, auditable, architecture-controlled, secure, cost-aware, testable, operable, and resistant to silent scope or architecture drift.

The implementation agent is not the architecture authority. Code implements the approved architecture; code does not redefine it.

## 2. Governing chain

Every project follows this chain:

Business Need → Product Definition → Requirements → Domain/Data → Architecture → HLD → ADRs → LLD/API/DB → Integration → AI/Agent Design → Security/Privacy → Cost Model → Roadmap/Backlog → Implementation → Verification → Operational Readiness → Release → Production → Monitoring → Controlled Change.

No stage may be skipped merely because code already exists.

## 3. Project classification

At first governance application classify the project as:

- NEW_PROJECT
- EXISTING_PROJECT

For an existing project, the initial governance pass is read-only with respect to existing application behavior. Inspect and document before remediation. For a new project, complete the baseline before product implementation except for explicitly approved research spikes.

## 4. Existing-project safety mode

The first existing-project baseline run must not silently change source code, database schemas, migrations, dependencies, framework versions, production configuration, deployments, public APIs, auth, tenancy, AI prompts, model providers, agents, integrations, or tests.

Permitted work is inspection, non-destructive verification, architecture reconstruction, documentation, ADR/CR proposals, risk classification, feature inventory, and baseline generation.

If the working tree is dirty, preserve and document it. Do not clean or overwrite unexplained work.

## 5. Mandatory project structure

Every governed project should contain authoritative artifacts under:

- `docs/00-governance/`
- `docs/01-product/`
- `docs/02-requirements/`
- `docs/03-architecture/`
- `docs/04-design/`
- `docs/05-delivery/`
- `docs/06-testing/`
- `docs/07-operations/`
- `docs/08-security-compliance/`
- `docs/09-releases/`

Do not create duplicate truth. Existing equivalent authoritative documents may be adopted if they meet this standard.

## 6. Document control

Authoritative documents must identify, where applicable:

- Document ID
- Title
- Version
- Status
- Owner
- Created date
- Last updated
- Related requirements
- Related ADRs
- Supersedes
- Change summary

Allowed lifecycle states are DRAFT, IN_REVIEW, APPROVED, FROZEN, and SUPERSEDED.

Frozen history must not be rewritten to make later implementation appear compliant.

## 7. Gate model

Use the following project gates:

- G0 Business
- G1 Product
- G2 Requirements
- G3 Domain & Data
- G4 Architecture
- G5 Detailed Design
- G6 Delivery Planning
- G7 Implementation
- G8 Verification
- G9 Operational Readiness
- G10 Production

Every gate must have entry criteria, required artifacts, exit criteria, approval status, and evidence.

## 8. Business and product baseline

Before implementation establish:

- Business case
- Problem statement
- Target customer, buyer, and user
- Value proposition
- Alternatives and competitors
- Monetization or internal value model
- Success criteria
- Assumptions
- Risks
- Go/No-Go criteria
- Product vision
- Personas
- User journeys
- In-scope and out-of-scope boundaries
- Release strategy

Out-of-scope is mandatory to prevent silent scope growth.

## 9. PRD standard

The PRD must state goals, non-goals, users, journeys, capabilities, functional requirements, non-functional requirements, assumptions, dependencies, constraints, success metrics, scope, and release strategy.

A PRD is not a marketing description. Requirements must be precise enough to derive acceptance criteria and tests.

## 10. Requirements standard

Every functional requirement must have a stable ID and define actor, preconditions, inputs, processing/business rule, output, failure behavior, acceptance criteria, priority, dependencies, and status.

Non-functional requirements must cover, as applicable:

- availability
- reliability
- latency
- performance
- concurrency
- scalability
- durability
- data integrity
- security
- privacy
- localization
- accessibility
- persistence
- backup/restore
- RPO/RTO
- observability
- maintainability
- testability
- portability
- recoverability
- cost
- AI quality
- integration reliability

Use measurable targets instead of vague terms such as "fast" or "secure".

## 11. Traceability

Maintain traceability:

Business Need → Requirement → Epic → Feature → Story → Architecture Component → API/Data → Code → Test → E2E Evidence → Release.

A feature with missing required traceability is not governance-complete.

## 12. Architecture baseline

Every project must have an architecture baseline describing:

- system context
- actors and external systems
- domains and responsibilities
- containers/deployables
- major components
- data stores
- integration boundaries
- AI boundaries
- security/trust boundaries
- deployment
- observability
- cost-relevant architecture

Use C4-style Context, Container, Component, and Deployment views where practical.

## 13. Architecture constitution

After approval, implementation may not independently alter:

- architecture style
- domain/service boundaries
- database technology or ownership
- tenancy model
- authentication or authorization model
- public API contracts
- source-of-truth ownership
- integration strategy
- AI orchestration
- agent strategy
- model-provider strategy
- RAG/knowledge architecture
- storage architecture
- deployment model
- security baseline
- observability architecture
- major framework versions
- material recurring cost controls

A material change requires formal ADR and/or Change Request.

## 14. ADR policy

Important technical decisions must be captured as Architecture Decision Records with status PROPOSED, ACCEPTED, REJECTED, DEPRECATED, or SUPERSEDED.

An ACCEPTED ADR is immutable as history. A later decision is represented by a new ADR that supersedes the previous ADR.

## 15. Change Requests and Decision Requests

Material changes use a Change Request containing problem, evidence, affected requirements/ADRs/components, current design, proposed design, alternatives, business/technical/security/data/AI/integration/cost/schedule/migration impact, backward compatibility, test plan, rollback plan, recommendation, and approval.

Escalate to a formal Decision Request only when architecture, product scope, business rule, security/compliance, destructive migration, irreversible choice, or material recurring cost genuinely requires authority outside the current baseline.

Ordinary engineering choices should be resolved from the approved architecture and best practices rather than casual user questions.

## 16. HLD and LLD

HLD describes system-level structure, containers, dependencies, data flows, external systems, trust boundaries, AI/integration layers, deployment, reliability, and observability.

LLD describes component responsibility, interfaces, functions, schemas, state transitions, API/DB interaction, retries, timeouts, idempotency, error handling, security controls, logging, metrics, and tests.

## 17. Domain and data architecture

Define the business domains before allowing implementation to create accidental module boundaries.

For important data identify:

- source
- owner
- authoritative system
- lifecycle
- retention/deletion
- sensitivity/classification
- residency
- backup
- access control
- auditability
- versioning

Distinguish user-entered, transactional, calculated, AI-generated, external, evidence, cached, and derived data.

## 18. Source-of-truth rule

AI is never the authoritative source of business facts merely because it generated an answer.

Authoritative state belongs to an approved database or external system. AI may interpret, classify, summarize, recommend, and explain authoritative information but must not silently invent prices, balances, inventory, order status, appointments, compliance state, financial results, or other factual business state.

## 19. Database design

Document database technology, schemas/tables, PK/FK, constraints, indexes, tenancy, audit fields, timestamps, versioning, deletion policy, migrations, retention, backup, and restore.

Do not replace a working database in an existing project without explicit evidence and approved change control.

## 20. API contracts

Public and internal integration contracts must be documented. Prefer contract-first APIs and OpenAPI where appropriate.

Define methods/routes, request/response schemas, authentication, authorization, errors, pagination, filtering, sorting, rate limits, idempotency, timeouts, and backward compatibility.

Frontend and backend may not rely on undocumented accidental behavior.

## 21. Integration architecture

Every external integration must identify purpose, owner, provider, authentication, permissions/scopes, direction, data flow, timeout, retry, rate limit, cache, circuit breaker, idempotency, failure behavior, fallback, audit, monitoring, cost, and real verification method.

AI must access business systems through governed tools/adapters/gateways rather than arbitrary provider-specific code paths.

## 22. AI architecture

AI design must explicitly separate:

- deterministic software
- source-of-truth data
- external-system truth
- retrieval
- AI reasoning
- tools
- workflows
- agents
- human approval

Document providers/models, prompt/config versioning, structured output, context, memory, retrieval, tool calling, orchestration, fallback, retry, validation, grounding/provenance, hallucination controls, evaluation, security, observability, latency, and cost.

## 23. Agent architecture

Do not create an agent when deterministic code, a query, rule engine, retrieval, workflow, or direct API call is sufficient.

Every production agent must identify purpose, inputs/outputs, tools, data permissions, memory, model, maximum LLM calls, maximum tool calls, maximum tokens, retries, execution time, escalation, failure behavior, risk, and expected cost.

Unlimited autonomous loops are prohibited unless explicitly approved by a new architecture decision with bounded safeguards.

## 24. Default AI execution budget

Unless an approved ADR states otherwise:

- simple workflow: 1 LLM call
- moderate workflow: no more than 2 LLM calls
- complex approved workflow: no more than 3 LLM calls

More calls require explicit architectural justification. Runtime must also bound tool calls, tokens, retries, duration, and cost.

## 25. Knowledge/RAG

When knowledge retrieval exists, design the complete pipeline: source → ingestion → parsing → normalization → chunking → metadata → embeddings/indexing → retrieval → reranking → context assembly → generation → source attribution.

Define authority, freshness, provenance, tenant isolation, conflict handling, poisoning protection, and failure behavior.

## 26. Security and privacy

Create a security baseline and threat model covering, as applicable:

- authentication and authorization
- RBAC/ABAC
- tenant isolation
- secrets
- encryption
- sessions
- API/webhook security
- database/storage/queue controls
- rate limiting
- CSRF/XSS/SQLi/SSRF
- dependency risk
- privilege escalation
- cross-tenant leakage
- prompt injection
- indirect prompt injection
- RAG poisoning
- AI tool abuse
- sensitive-data leakage
- auditability

Assess applicable privacy and regulatory obligations. For Saudi-targeted systems explicitly assess PDPL/SDAIA requirements and applicable NCA controls. Never claim compliance without evidence.

## 27. Cost architecture

Track fixed and variable costs for compute, DB, cache, queue, storage, backup, network, observability, external APIs, AI tokens, embeddings, OCR/search, messaging, email, and third-party SaaS.

Where possible derive cost per customer, workflow, transaction, AI request, report, or business unit. Unknown pricing is marked UNKNOWN, never fabricated.

Material recurring cost increases require visibility and change control before implementation.

## 28. Delivery planning

Roadmaps and phase plans must define objective, scope, dependencies, entry criteria, deliverables, exit criteria, planned/actual dates where known, status, risk, and evidence.

Backlog hierarchy is:

VISION → CAPABILITY → EPIC → FEATURE → USER STORY → TASK → TEST.

Every backlog item must map to requirements and acceptance/test criteria.

## 29. Definition of Ready

Implementation cannot start until relevant requirement and acceptance criteria exist, architecture compliance is checked, UX/API/DB/integration/AI/security impacts are known, dependencies are identified, tests are defined, and required ADRs are accepted.

## 30. Definition of Done

Code existence, UI existence, endpoint existence, passing unit tests, or mock-only success does not make a feature done.

DONE requires, as applicable:

- requirement satisfied
- architecture compliant
- unit/integration/contract/DB/migration/security/failure tests
- browser/live E2E
- real persistence and refresh persistence
- restart persistence where relevant
- real external integration verification
- AI evaluation
- user-visible functionality
- logging/metrics/error handling
- documentation and traceability updates
- rollback/release evidence

Always distinguish MOCK_VERIFIED, INTEGRATION_VERIFIED, LIVE_E2E_VERIFIED, and PRODUCTION_VERIFIED.

## 31. Testing and AI evaluation

Testing strategy must cover unit, integration, contract, database, migration, browser, E2E, regression, security, load, failure, recovery, accessibility, localization, production smoke, and AI evaluation where relevant.

AI evaluation must measure correctness/task success, groundedness, relevance, hallucination, source accuracy, tool selection/arguments, structured output, ambiguity and missing-data behavior, multilingual/Arabic behavior where applicable, policy compliance, fallback, cost, latency, and failure handling.

## 32. Reliability and operations

Before production define SLI/SLO, monitoring, logging, alerting, ownership/escalation, backup/restore, RPO/RTO, DR, incident response, runbooks, and production readiness.

Build success is not operational readiness.

## 33. Governance dashboard

Every product project should expose an internal governance dashboard unless explicitly excluded by an accepted ADR.

It should show product/architecture/governance versions, current phase/gate, Git/release state, roadmap/milestones, ADRs/CRs, requirements, backlog, testing tiers, AI agents/limits where relevant, risks, costs, documentation health, releases, and production readiness.

Dashboard status must come from a machine-readable governance manifest where practical and must not contain invented completion percentages.

## 34. Versioning and baselines

Version Product, Architecture, PRD, Requirements, API, DB migrations, AI configuration/prompts/evaluation sets, deployment, and releases independently where relevant.

A baseline snapshot records Git commit/branch/worktree, version set, known risks/gaps, production status, and next approved phase.

Frozen baselines remain historical evidence.

## 35. Workspace and design review

Perform formal workspace/design/architecture reviews before major phases, production releases, material ADR/CR changes, major DB/security/integration/dependency/AI changes.

Reviews must inspect source, Git state, architecture drift, DB/migrations, APIs, integrations, AI/agents, security, tests, docs, deployment, operations, UX, persistence, error states, and technical debt.

## 36. Architecture drift

Detect unauthorized databases, services, dependencies, AI providers, agents, APIs, infrastructure, integrations, auth paths, tenant model changes, routes, or data stores.

Do not edit documentation after the fact merely to legitimize accidental implementation. Report drift and raise CR/ADR as required.

## 37. Project status

Never publish a completion percentage unless an approved mathematical model defines it.

Prefer counts such as total/implemented/integration-verified/live-E2E/production-ready requirements, accepted/proposed ADRs, open risks, and explicit GO/CONDITIONAL_GO/NO_GO state.

## 38. Production readiness gate

Production requires explicit GO, CONDITIONAL_GO, or NO_GO based on requirements, architecture, DB/migrations/persistence, APIs/integrations, AI evaluation, security/tenancy, browser and external E2E, load/failure behavior, observability/alerts, backup/restore/DR, rollback, cost, documentation, and operations readiness.

## 39. Future feature protocol

Before every material future feature, read:

1. this Universal Standard
2. Architecture Constitution
3. Current Baseline
4. relevant ADRs
5. relevant requirements
6. HLD/LLD
7. backlog item
8. Definition of Ready
9. Definition of Done

Then produce an implementation compliance check covering requirement, backlog item, architecture baseline, ADR, DB/API/integration/AI/security/cost impact, test plan, and whether architecture change is required.

If architecture change is required, stop the affected implementation and initiate formal change control.

## 40. Absolute rules

- No architecture improvisation.
- No hidden scope change.
- No silent DB/API/auth/tenancy/integration/AI-agent change.
- No uncontrolled agent loops or unlimited LLM spend.
- No fake or unsourced business facts.
- No mock-only production claims.
- No invented dates or completion percentages.
- No undocumented integrations or AI behavior.
- No production release without readiness evidence.
- No phase freeze with unexplained workspace changes.
- No feature completion without real user-visible persistent behavior where applicable.

## 41. Final principle

The architecture is the approved design contract. The backlog implements requirements. Code implements the backlog. Tests verify code. E2E verifies the real product. Production evidence verifies the release. Change control protects the baseline.
