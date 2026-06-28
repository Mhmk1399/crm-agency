# ADR-001: Authentication Strategy

## Status
Accepted

## Context
The application needs authentication with multi-tenant organisation scoping. Options considered:
1. NextAuth.js / Auth.js
2. Custom JWT-based session layer
3. Third-party auth service (Clerk, Auth0)

## Decision
Use a **custom JWT session layer** with `jose` for token handling and `bcryptjs` for password hashing.

## Rationale
- NextAuth.js adds complexity for a system that needs tight control over session shape (organisation context, role, permissions).
- `jose` is Edge-runtime compatible, works in Next.js middleware.
- Custom layer gives full control over session payload, refresh logic, and organisation switching.
- Third-party services add cost and vendor lock-in for a self-hosted system.

## Consequences
- Must implement password reset, session expiry, and token refresh ourselves.
- Must ensure httpOnly cookies, SameSite, and secure flags are set correctly.
- Session payload includes `userId`, `organisationId`, `role`, `permissions`.
