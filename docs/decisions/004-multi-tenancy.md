# ADR-004: Multi-Tenancy Approach

## Status
Accepted

## Context
The system must support multiple organisations without cross-tenant data leakage, while starting with a single tenant.

## Decision
Use **shared database with organisation-scoped documents**. Every tenant-owned document includes `organisationId`. Every query filters by it.

## Rationale
- Simpler deployment than database-per-tenant.
- Compound indexes on `(organisationId, ...)` provide efficient queries.
- Organisation ID is extracted from the authenticated session and injected into every repository call.
- No additional infrastructure needed for a single initial tenant.

## Consequences
- Every repository method must accept and enforce `organisationId`.
- Integration tests must verify tenant isolation.
- Unique constraints must be compound (e.g., `organisationId + projectCode`).
- Admin/superadmin queries that span organisations must be explicitly separate.
