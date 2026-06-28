# Architecture

## Overview

The Agency Business Operating System is a multi-tenant application for managing the full lifecycle of a service-based software agency: sales, delivery, finance, marketing, and capacity planning.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
│ Owner | Admin | PM | Developer | Designer                   │
│ Marketing | Sales | Finance | Client                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS 16 APPLICATION (App Router)            │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth Layer  │  │  Middleware   │  │  Correlation IDs  │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   PRESENTATION                        │   │
│  │  Server Components (data) + Client Components (UI)    │   │
│  │  Route Handlers (API) + Server Actions (mutations)    │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │                   DOMAIN LAYER                        │   │
│  │  Services │ Validators │ State Machines │ Events      │   │
│  │  Permissions │ Financial Calculations                 │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │                   DATA LAYER                          │   │
│  │  Repositories │ Mongoose Models │ Audit Logger        │   │
│  └──────────────────────────┬───────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     MONGODB (Mongoose)                       │
│  Organisation-scoped collections with compound indexes       │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | Next.js 16.2.9 (App Router)         |
| Language       | TypeScript (strict mode)            |
| UI             | React 19, Tailwind CSS 4            |
| Database       | MongoDB with Mongoose               |
| Validation     | Zod                                 |
| Forms          | React Hook Form + Zod resolvers     |
| Server State   | TanStack Query (client-side only)   |
| Auth           | Custom JWT session layer            |
| Testing        | Vitest (unit), Playwright (e2e)     |
| Containerisation | Docker + Docker Compose           |

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Authenticated routes
│   │   ├── layout.tsx            # Dashboard shell with sidebar/nav
│   │   ├── page.tsx              # Owner dashboard
│   │   ├── sales/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── time-tracking/
│   │   ├── capacity/
│   │   ├── services/
│   │   ├── finance/
│   │   ├── marketing/
│   │   ├── team/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── approvals/
│   ├── api/                      # Route handlers
│   │   ├── auth/
│   │   └── webhooks/
│   └── layout.tsx                # Root layout
│
├── modules/                      # Business domain modules
│   ├── identity/                 # Auth, users, roles
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── validators/
│   │   ├── actions/
│   │   ├── components/
│   │   ├── types/
│   │   └── constants/
│   ├── organisations/
│   ├── sales/                    # Leads, proposals
│   ├── clients/
│   ├── services/                 # Service catalogue
│   ├── projects/
│   ├── tasks/                    # Kanban, task management
│   ├── time-tracking/
│   ├── capacity/
│   ├── finance/                  # Invoices, payments, costs
│   ├── marketing/                # Campaigns, content
│   ├── approvals/
│   ├── notifications/
│   ├── reporting/
│   └── automation/               # Future n8n integration boundary
│
├── models/                       # Mongoose model definitions
├── lib/                          # Shared infrastructure
│   ├── db.ts                     # MongoDB connection
│   ├── auth.ts                   # Session management
│   ├── permissions.ts            # Permission system
│   ├── logger.ts                 # Structured logging
│   ├── errors.ts                 # Typed error classes
│   ├── money.ts                  # Financial arithmetic
│   ├── audit.ts                  # Audit log helper
│   ├── events.ts                 # Domain event system
│   ├── correlation.ts            # Request correlation IDs
│   └── api-response.ts           # Consistent API responses
│
├── types/                        # Shared TypeScript types
└── tests/                        # Integration & e2e tests
```

## Architectural Principles

### 1. Domain-first organisation
Business modules own their logic. The `app/` directory handles routing; `modules/` owns domain rules.

### 2. Thin UI, strong domain
React components never contain financial logic, state transition rules, or permission checks. These live in domain services.

### 3. Repository pattern
No raw Mongoose queries in pages, route handlers, or server actions. All DB access goes through repositories scoped by `organisationId`.

### 4. Multi-tenant by default
Every document includes `organisationId`. Every query filters by it. No exceptions.

### 5. Financial safety
Monetary values stored as integers (smallest unit). A shared `money` utility handles all arithmetic. Historical snapshots prevent retroactive cost changes.

### 6. Explicit state machines
Status transitions are validated by transition services. No arbitrary status updates.

### 7. Audit trail
Important changes produce audit logs with actor, action, entity, old/new values, and timestamp.

### 8. Clean automation boundary
Domain events are emitted internally. External automation (n8n) will consume them later without rewriting domain logic.

## Four Engines

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Sales Engine │  │   Delivery   │  │   Finance    │  │  Marketing   │
│              │  │   Engine     │  │   Engine     │  │   Engine     │
│ Leads        │  │ Projects     │  │ Costs        │  │ Campaigns    │
│ Proposals    │  │ Tasks        │  │ Revenue      │  │ Content      │
│ Clients      │  │ Boards       │  │ Invoices     │  │ Scheduling   │
│ Pipeline     │  │ Time         │  │ Payments     │  │ Metrics      │
│ Forecasting  │  │ Capacity     │  │ Profitability│  │ Lead attr.   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                              │
                    Shared MongoDB + Domain Events
```

## Key Design Decisions

See [decisions/](decisions/) for Architecture Decision Records.

## Security Model

- Custom JWT-based authentication with httpOnly cookies
- Middleware-level route protection
- Server-side permission checks on every action
- Organisation-scoped data access
- Salary/compensation data behind elevated permissions
- Input validation at every boundary (Zod)
- Rate limiting on auth endpoints
- CSRF protection via SameSite cookies + origin checking
- Audit logging for all sensitive operations
