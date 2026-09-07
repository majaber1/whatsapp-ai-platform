---
Document ID: WA-ARCH-TEN-001
Title: WACRM Tenancy Gap Analysis
Version: 1.1
Status: IN_REVIEW
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related Requirements: WA-FR-AUTH-*, WA-NFR-SEC-*
Related ADRs: ADR-004, ADR-011
Supersedes: Version 1.0
Change Summary: Replaces preliminary assumptions with evidence from WACRM migrations 017/018/020 and records the explicit one-account-per-user and one-WhatsApp-number-per-account constraints.
---
# WACRM Tenancy Gap Analysis

## Evidence-based current state

The pinned WACRM baseline has a real account-level tenancy foundation and should not be treated as a single-user-only application.

Migration `017_account_sharing.sql` explicitly introduces:

- `accounts`
- `account_invitations`
- roles `owner`, `admin`, `agent`, `viewer`
- `profiles.account_id`
- `profiles.account_role`
- account-scoped `account_id` columns on core domain tables
- account-membership RLS policies
- account-scoped hot-path indexes

However, the same migration explicitly locks the current membership design to **one account per user**. Membership is stored directly on `profiles.account_id` rather than a many-to-many membership table. Migration `018_account_member_rpcs.sql` reinforces that model: removing a member moves the user to a newly-created personal account rather than removing one of several memberships.

The baseline also explicitly enforces **one WhatsApp configuration/number per account** through `UNIQUE(account_id)` on `whatsapp_config`. That is narrower than our target platform, where a tenant may operate multiple WhatsApp numbers/accounts and bind AI Employees or routing policies to them.

This is a target-architecture gap, not a reason to discard WACRM. The existing account-level RLS and role design are useful migration foundations.

## Target model

```text
Platform User
   |
   +-- TenantMembership -- Tenant A
   |      role / status / permissions
   |
   +-- TenantMembership -- Tenant B
          role / status / permissions

Tenant
  +-- WhatsApp Accounts
  |     +-- Phone Number A
  |     +-- Phone Number B
  +-- AI Employees
  +-- Contacts / Conversations
  +-- CRM / Pipeline
  +-- Knowledge
  +-- Integrations
  +-- Automations
  +-- Usage / Billing
  +-- Audit
```

## Gap table

| Area | Pinned WACRM evidence | Target | Classification |
|---|---|---|---|
| Account entity | `accounts` is present and domain rows are account-scoped | canonical Tenant/Organization boundary | KEEP / EVOLVE |
| Roles | `owner/admin/agent/viewer` | tenant membership role plus extensible permissions/capabilities | EXTEND |
| RLS | account-membership RLS is broadly applied | complete tenant-scoped isolation for all retained/new business tables | KEEP / VERIFY / EXTEND |
| User membership | `profiles.account_id`; explicitly one-account-per-user | many-to-many User ↔ TenantMembership | REFACTOR IN PHASE 1 |
| Member removal | removed user is moved to a new personal account | remove one membership without changing unrelated memberships | REFACTOR IN PHASE 1 |
| WhatsApp ownership | `whatsapp_config` has `UNIQUE(account_id)` | multiple WABA/phone-number connections per tenant | REFACTOR IN PHASE 1 |
| Phone routing | `phone_number_id` is globally unique | retain uniqueness of provider phone-number identity while allowing many rows per tenant | KEEP INVARIANT / EVOLVE OWNERSHIP |
| Contacts/conversations | account-scoped | tenant-scoped | KEEP / VERIFY |
| Automations/flows | account-scoped with account-aware indexes | tenant-scoped and tool-policy aware | KEEP / EXTEND |
| AI configuration | one `ai_configs` row per account | tenant may own multiple versioned AI Employees sharing controlled runtime/provider policy | REPLACE/EVOLVE MODEL |
| Knowledge | account-owned KB with FTS + optional pgvector | tenant + employee/scoped collections with provenance, freshness and policy | EXTEND |
| Billing/usage | not target-complete | tenant-owned usage, limits, metering and subscription | ADD |
| Audit | partial/current implementation dependent | tenant-aware immutable audit/evidence events | EXTEND |

## Required Phase 1 architecture change

Do **not** implement this during Phase 0. Phase 1 must begin with an approved tenancy migration Change Request that covers at minimum:

1. Introduce canonical `tenants` or formally adopt/rename `accounts` as the tenant aggregate.
2. Introduce `tenant_memberships` (or equivalent) with a unique `(tenant_id, user_id)` membership key.
3. Migrate `profiles.account_id/account_role` without losing identity/profile data.
4. Replace authorization helpers that assume exactly one active account.
5. Add explicit current-tenant selection/session context where a user belongs to more than one tenant.
6. Remove `UNIQUE(account_id)` from `whatsapp_config` and introduce a multi-number model with stable provider identifiers, status and optional primary-number semantics.
7. Preserve global/provider-level uniqueness required for `phone_number_id` routing.
8. Rebuild and verify RLS on every tenant-owned table and child relation.
9. Verify service-role paths cannot bypass tenant scoping through caller-supplied IDs.
10. Define migration rollback/restore strategy.

## Mandatory verification before accepting the change

- migration applies from a clean WACRM baseline
- migration applies to representative existing data
- no orphaned rows
- no duplicate memberships
- owner/admin/agent/viewer semantics preserved or deliberately superseded
- user can belong to two tenants and switch context safely
- cross-tenant reads/writes fail at DB/RLS level
- service-role webhook routes only to the owning tenant/phone configuration
- two WhatsApp numbers can coexist under one tenant
- the same provider phone number cannot be claimed by multiple tenants
- inbox/contacts/conversations remain isolated
- automations/flows remain tenant-scoped
- rollback/restore is proven on test data

## Safety rule

Phase 0 is audit/baseline only. No tenancy schema rewrite is authorized until the tenancy Change Request, migration design, RLS matrix, failure tests and rollback plan are reviewed under the Universal Project Governance Standard.
