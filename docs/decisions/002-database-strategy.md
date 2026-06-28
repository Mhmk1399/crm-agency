# ADR-002: Database Strategy

## Status
Accepted

## Context
Need a database that supports flexible schemas, fast iteration, and scales well for a multi-tenant SaaS.

## Decision
Use **MongoDB with Mongoose** as the ODM.

## Rationale
- MongoDB's document model maps naturally to the domain entities.
- Mongoose provides schema validation, middleware hooks, and TypeScript support.
- Compound indexes on `organisationId` + field provide efficient multi-tenant queries.
- Flexible schema supports the varied entity structures across engines.

## Consequences
- Must enforce organisation scoping manually on every query.
- Must use separate collections for unbounded lists (activities, comments, time entries) instead of embedding.
- Must create deliberate indexes based on query patterns.
- Financial data requires integer storage and careful handling (no native decimal type).
