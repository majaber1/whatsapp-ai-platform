---
Document ID: CR-002
Title: Tenant Memberships and Multiple WhatsApp Connections
Version: 1.0
Status: PROPOSED
Owner: Architecture Governance Authority
Created: 2026-09-07
Last Updated: 2026-09-07
Related ADRs: ADR-004, ADR-011
Related Audit Findings: WA-AUDIT-101, WA-AUDIT-102, WA-AUDIT-106
---
# CR-002 — Tenant Memberships and Multiple WhatsApp Connections

## Problem

The imported WACRM account layer is useful but narrower than the target SaaS model:

- active membership is stored directly on `profiles.account_id/account_role`, making one active account per user the normal model;
- removing a member moves the user to a separate personal account;
- `whatsapp_config` is one row per account.

Our target product requires users who can belong to multiple tenants, tenant-specific roles/permissions, and tenants that can operate multiple WhatsApp connections/numbers.

## Proposed target

1. Formally adopt `accounts` as the tenant aggregate or migrate to a canonical `tenants` name through a separately designed compatibility plan.
2. Introduce a membership relation such as `tenant_memberships(tenant_id,user_id,role,status,...)` with unique tenant/user membership.
3. Establish explicit current-tenant context for UI/API requests without treating it as authority for privileged external webhooks.
4. Replace one-config-per-account with a `whatsapp_connections`/equivalent model supporting multiple connections/phone numbers per tenant.
5. Retain provider `phone_number_id` uniqueness and use it as authoritative inbound routing input.
6. Rebuild/verify RLS and helper functions against the membership relation.

## Required tests

- one user belongs to two tenants
- role differs between tenants
- tenant switching never leaks data
- removed membership does not affect other memberships
- two WhatsApp numbers coexist in one tenant
- same provider phone number cannot belong to two tenants
- inbound webhook resolves exactly one tenant/connection
- service-role paths cannot trust caller-supplied tenant IDs
- contacts/conversations/messages/knowledge/flows/automations remain isolated
- migration from existing WACRM account records succeeds and rollback is proven on test data

## Migration and compatibility

The migration must preserve existing WACRM accounts, roles and business data. Do not perform destructive renaming or ownership reassignment without a reversible mapping and migration evidence.

## AI Employee impact

AI Employees will belong to tenants and may be assigned to one or more WhatsApp connections through explicit routing policies. This CR is therefore a prerequisite for final AI Employee channel deployment semantics.

## Decision

**PROPOSED — required before Phase 1 tenancy implementation.**
