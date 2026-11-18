# Agency CRM Repository Capabilities

> Source-of-truth inventory of the code currently present in this repository.
> Verified against the implementation on 2026-11-18. This document describes
> what exists in code, not everything proposed by the older roadmap documents.

## 1. Executive summary

This repository is a multi-tenant agency CRM and business operating system. It
combines sales CRM, proposals, project delivery, task management, finance,
staffing, role-based access control, reports, and operational dashboards in one
Next.js application backed by MongoDB.

The implemented product can currently:

- register organisations and owners, authenticate users, and manage sessions;
- add organisation members with one of nine roles;
- customize permissions per role and organisation;
- isolate records by organisation and restrict non-admin users to related data;
- manage leads, clients, proposals, projects, tasks, services, boards, finance,
  team records, approvals, notifications, and related supporting records;
- show owner, sales, finance, personal-work, and document-count dashboards;
- calculate project financials and a project health score;
- generate permission-aware reports across 23 resource types;
- provide permission-aware global search;
- create audit records for generic CRUD changes and selected workflows;
- run as a standalone Next.js server or Docker container.

Repository totals at the time of this inventory:

| Area | Count |
| --- | ---: |
| Mongoose model files | 26 |
| API route files | 67 |
| Permission resources | 29 |
| Reportable resources | 23 |
| Built-in roles | 9 |
| Dashboard tabs | 13 |

## 2. Technology stack

| Layer | Implementation |
| --- | --- |
| Framework | Next.js 16.2.9, App Router and Route Handlers |
| UI runtime | React 19.2.4 |
| Language | TypeScript with strict mode |
| Styling | Tailwind CSS 4 and custom CSS variables/components |
| Database | MongoDB through Mongoose 9.7.1 |
| Authentication | Custom JWT sessions using `jose` and HTTP-only cookies |
| Password hashing | `bcryptjs`, cost factor 12 |
| Validation | Zod 4 on authentication inputs; Mongoose validation elsewhere |
| Client state | TanStack Query 5 |
| Forms | React Hook Form and `@hookform/resolvers` |
| Drag and drop | `@dnd-kit` packages |
| IDs | MongoDB ObjectIds plus Nano ID request correlation IDs |
| Deployment | Multi-stage Node 20 Alpine Docker image, standalone Next.js output |

Required runtime environment variables are `MONGODB_URI` and `JWT_SECRET`.
`NEXT_PUBLIC_APP_URL` and `LOG_LEVEL` are also consumed by deployment/config.
Liara object-storage variables exist in `.env.local`, but no upload or object
storage implementation currently consumes them.

## 3. Application architecture

```text
Browser
  -> Next.js pages and React dashboard
  -> Route Handler APIs under /api
  -> JWT authentication and role/permission checks
  -> organisation and user-level data scopes
  -> Mongoose models
  -> MongoDB
```

Important directories:

| Path | Responsibility |
| --- | --- |
| `app/` | Pages, layouts, and API Route Handlers |
| `components/tabs/` | Product screens shown inside the dashboard shell |
| `components/dashboard/` | Sidebar, command palette, metrics, CRUD shell, and detail views |
| `components/ui/` | Reusable tables, forms, modals, badges, pickers, buttons, and toasts |
| `lib/` | Auth, permissions, data scoping, CRUD factories, money, reporting, logging, and errors |
| `models/` | MongoDB/Mongoose schemas and indexes |
| `docs/` | Architecture notes, ADRs, formulas, permissions, roadmap, and older design plans |

The root page redirects to `/dashboard`. Unauthenticated protected requests are
redirected to `/login`. The authenticated dashboard is a client-side tabbed
workspace rather than a separate URL for every business module.

## 4. User-facing product areas

### Dashboard

- Organisation-wide document counts and headline metrics.
- Active projects, pipeline value, weighted pipeline, monthly revenue,
  outstanding invoices, overdue invoices, overdue tasks, and open work.
- Role-aware views: owner/admin can see global data; other roles see permitted,
  user-related records.
- Sidebar count badges and periodic TanStack Query refresh.

### My Work

- Personal task totals, priority tasks, overdue work, work in review, and work
  due today.
- Accessible finance snapshot: invoice status, overdue invoices, recent
  payments, operational expenses, and project expenses.
- Visible team/profile/compensation summary based on permissions and data scope.

### Sales CRM

- Lead list, creation, editing, deletion, filtering, status changes, pipeline
  totals, weighted pipeline totals, and follow-up warnings.
- Client records with contact, billing, source, linked-lead, tax, and activity
  information.
- Proposal records with line items, pricing, cost, profit, margin, validity,
  status, lead/client relationships, and acceptance workflow.
- A backend lead-to-client conversion endpoint and a proposal-to-project
  acceptance endpoint.

### Project delivery

- Projects with client/proposal links, project manager, lifecycle status,
  contract/budget data, hours, profit, margin, progress, health, and risk.
- Project members, allocation, billing-rate snapshots, and cost snapshots.
- Project milestones with due dates and invoice-on-completion metadata.
- Kanban board schemas with default columns and WIP limits.
- Project financial summary combining tasks, approved expenses, and invoices.
- Project health scoring for schedule, budget, completion, blocked work, hours,
  and capacity.

### Task management

- Kanban-style task screen with backlog, to-do, in-progress, review, blocked,
  and done columns.
- Create, edit, assign, reprioritize, change status, and delete tasks.
- Task types for original scope, bugs, client revisions, paid change requests,
  internal rework, marketing, sales, administration, and support.
- Estimates, actual minutes, costs, billing values, dates, dependencies, tags,
  reviewers, and blocked reasons.
- Task detail support for comments, checklist items, and attachment metadata.

### Finance

- Invoice CRUD with line items, discount, tax, totals, due dates, paid amount,
  outstanding amount, and billing status.
- Payment CRUD with invoice relationship, currency, method, reference, date,
  notes, and idempotency key.
- Operational-expense and project-expense tracking.
- Financial snapshots for monthly, quarterly, yearly, or per-project metrics.
- Finance dashboard metrics for revenue, direct costs, gross profit/margin,
  outstanding/overdue amounts, labour hours, and project profitability.

### Team and access management

- Member creation with hashed passwords and role assignment.
- Team profiles for job title, department, skills, employment type, start/end
  dates, weekly capacity, and active status.
- Compensation profiles for salary, employer costs, allocated overhead,
  fully-loaded cost, billable hours, and internal hourly cost.
- Access Manager matrix for per-role, per-resource view/post/update/delete
  permissions. Owner permissions are locked.
- User profile editing for name, email, and password.

### Reports and search

- Reports over 23 resource types with text search, date ranges, typed filters,
  numeric min/max filters, sorting, pagination, grouped counts, and numeric
  sum/average/minimum/maximum summaries.
- Global search over tasks, projects, leads, clients, proposals, invoices,
  payments, expenses, users, and team profiles.
- Search returns normalized results linked to the appropriate dashboard tab.
- Both systems apply permission checks, organisation scope, and user data scope.

### Settings

- Organisation name, domain, default currency, timezone, default weekly hours,
  default billable percentage, and capacity split.
- Current-user password change.
- Organisation slug and owner are protected from settings updates.

## 5. Authentication and security model

### Session behavior

- Login uses email and password.
- Passwords are stored only as bcrypt hashes.
- A successful login issues a signed HS256 JWT in an HTTP-only `session`
  cookie.
- Session lifetime is seven days.
- Cookies use `SameSite=Lax`, path `/`, and `Secure` in production.
- Session payload contains `userId`, `organisationId`, `role`, `email`, and
  `name`.
- Logout removes the session cookie.
- Updating profile identity reissues the session with the updated name/email.

### Roles

The built-in roles are:

1. `owner`
2. `admin`
3. `project_manager`
4. `developer`
5. `designer`
6. `sales`
7. `marketing`
8. `finance`
9. `client`

`owner` always has every permission. `admin` has every default permission
except Access Manager permissions. Other roles receive narrower defaults.
Custom permission arrays can override a role's defaults for one organisation.

### Permission system

Permissions use `<resource>.<action>` strings. Actions are `view`, `post`,
`update`, and `delete`. The 29 resources are:

```text
dashboard, leads, clients, proposals, projects, tasks,
project-milestones, project-members, project-expenses, finance,
invoices, payments, operational-expenses, financial-snapshots,
team, users, team-member-profiles, compensation-profiles,
settings, access, reports, approvals, boards, services,
service-packages, notifications, task-comments, task-checklists,
task-attachments
```

### Multi-tenancy and record-level scope

Almost every business record contains `organisationId`. Generic CRUD handlers
always add the current session's organisation to queries and writes.

Owner and admin roles have global data access within their organisation after
passing the relevant permission. Other roles receive relationship-based scopes:

- leads: owned or created by the user;
- clients: created by the user or linked to their leads;
- projects: owned/managed, joined as a member, linked through clients, or
  related through assigned tasks;
- tasks: assigned, reported, reviewed, or created by the user;
- invoices and payments: created/recorded by the user;
- profiles and compensation: the user's own records;
- approvals: requested by or assigned to the user;
- comments/checklists/attachments: owned by the user or linked to their tasks.

### API response and error format

Success:

```json
{
  "success": true,
  "data": {},
  "requestId": "req_..."
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {}
  },
  "requestId": "req_..."
}
```

Typed errors cover validation, authentication, authorization, missing records,
conflicts, invalid state transitions, financial calculation problems, capacity
conflicts, database failures, and rate limiting. Not every declared error type
is currently used by a route.

## 6. Data models

All monetary values are numbers intended to represent integer currency units.
Most models use automatic `createdAt` and `updatedAt` timestamps.

### Identity and organisation

| Model | Purpose and important fields |
| --- | --- |
| `Organisation` | Tenant boundary. Name, unique slug, domain, logo, owner, active state, currency, timezone, capacity split, weekly hours, and billable percentage. |
| `User` | Login identity. Email, hidden password hash, name, avatar, organisation, role, active state, and last login. Email is unique within an organisation. |
| `RolePermission` | Organisation-specific custom permission list for a role. Unique per organisation and role. |
| `TeamMemberProfile` | Employment profile: user, title, department, skills, dates, employment type, weekly capacity, and active state. Unique per organisation/user. |
| `CompensationProfile` | Salary and allocated costs, fully-loaded monthly cost, realistic billable hours, internal hourly cost, effective dates, and active state. |
| `AuditLog` | Actor, action, entity, previous/new values, timestamp, source, IP address, and request ID. |

### CRM and sales

| Model | Purpose and important fields |
| --- | --- |
| `Lead` | Contact/company data, source, owner, value, probability, close/follow-up dates, tags, notes, and status: `new`, `contacted`, `qualified`, `proposal_sent`, `negotiation`, `won`, or `lost`. |
| `Client` | Converted or direct client with lead link, contact and billing data, tax ID, source, creator, notes, and active state. |
| `Proposal` | Number, lead/client, title, description, line items, subtotal/discount/tax/total, expected cost/profit/margin, validity and lifecycle timestamps. Statuses: `draft`, `sent`, `viewed`, `accepted`, `rejected`, `expired`, `cancelled`. |
| `Service` | Service catalogue entry with slug, category, deliverables, exclusions, pricing type, prices, hour range, target margin, risk, revisions, delivery days, required roles, and active state. |
| `ServicePackage` | Basic/standard/premium/custom tier linked to a service, with features, price, hours, delivery days, revisions, and active state. |

### Delivery and work management

| Model | Purpose and important fields |
| --- | --- |
| `Project` | Client/proposal/services, code, owner, manager, dates, contract and budget, estimated/actual hours, expected/actual profit and margin, health, risk, and progress. Statuses: `planned`, `active`, `on_hold`, `client_review`, `completed`, `cancelled`. |
| `ProjectMember` | Project/user membership, role, billing/cost snapshots, allocated hours, join/leave dates, and active state. Unique per project/user. |
| `ProjectMilestone` | Project checkpoint with title, description, due/completed dates, order, completion, and invoice trigger/amount. |
| `Board` | Project Kanban board containing embedded ordered columns, WIP limits, colors, and default-board flag. |
| `Task` | Project/board/column, hierarchy, milestone, assignees, reporter/reviewer, priority, status, work type, estimates, actuals, cost snapshots, billing, dates, dependencies, tags, revisions, order, and blocking information. |
| `TaskChecklistItem` | Ordered task sub-item with completion state, completion time, and completing user. |
| `TaskComment` | Task discussion entry with author and content. |
| `TaskAttachment` | Attachment metadata: task, file name/URL/size/MIME type, and uploader. The file transfer itself is not implemented. |

Task priorities are `low`, `medium`, `high`, and `urgent`. Task statuses are
`backlog`, `todo`, `in_progress`, `review`, `blocked`, and `done`.

### Finance

| Model | Purpose and important fields |
| --- | --- |
| `ProjectExpense` | Project, description, category, currency, amount, date, receipt URL, approval state/approver, and submitter. |
| `OperationalExpense` | Non-project expense with description, category, currency, amount, date, notes, and creator. |
| `Invoice` | Project/client/milestone, unique number, currency, line items, subtotal, discount, tax, total, paid/outstanding amounts, lifecycle dates, notes, and creator. |
| `Payment` | Invoice payment with currency, amount, method, reference, date, notes, recorder, and organisation-unique idempotency key. |
| `FinancialSnapshot` | Historical period/type, revenue, direct cost, gross profit/margin, overhead, net profit, invoiced/paid/outstanding amounts, date, project, and metadata. |

Supported currencies in finance schemas are `IRR`, `USD`, and `GBP`.

### Platform workflows

| Model | Purpose and important fields |
| --- | --- |
| `ApprovalRequest` | Generic entity approval assigned from one user to another, with pending/approved/rejected state, decision, notes, and decision time. |
| `Notification` | User notification with title, message, type, optional linked entity, read state, and read time. |

## 7. API reference

All endpoints return JSON except health `HEAD`. Unless marked public, endpoints
require the session cookie and the relevant permission.

### Standard CRUD behavior

The resources below expose:

- `GET /api/<resource>` — paginated list;
- `POST /api/<resource>` — create;
- `GET /api/<resource>/:id` — fetch one;
- `PATCH /api/<resource>/:id` — update;
- `DELETE /api/<resource>/:id` — delete.

List query parameters:

| Parameter | Behavior |
| --- | --- |
| `page` | Page number, minimum 1, default 1 |
| `limit` | Page size, 1–100, default 20 |
| `search` | Case-insensitive search over the resource's configured search fields |
| `sort` | Field used for sorting |
| `order` | `desc` for descending; any other value is ascending |
| `status` | Exact status filter when the model has a status field |

Every standard CRUD route adds organisation scope. Create fills common actor
fields such as `createdBy`, `ownerId`, `reporterId`, `submittedBy`, and
`recordedBy` when absent. Create/update/delete operations write audit records.

| Resource path | Model | Search fields | Populated references |
| --- | --- | --- | --- |
| `/api/approvals` | ApprovalRequest | — | — |
| `/api/boards` | Board | name | — |
| `/api/clients` | Client | name, companyName, email | — |
| `/api/compensation-profiles` | CompensationProfile | — | — |
| `/api/financial-snapshots` | FinancialSnapshot | — | — |
| `/api/invoices` | Invoice | invoiceNumber | clientId, projectId |
| `/api/leads` | Lead | name, companyName, email | ownerId |
| `/api/notifications` | Notification | title | — |
| `/api/operational-expenses` | OperationalExpense | description | — |
| `/api/payments` | Payment | reference | — |
| `/api/project-expenses` | ProjectExpense | description | — |
| `/api/project-members` | ProjectMember | — | — |
| `/api/project-milestones` | ProjectMilestone | title | — |
| `/api/projects` | Project | name, projectCode | clientId, projectManagerId |
| `/api/proposals` | Proposal | title, proposalNumber | leadId, createdBy |
| `/api/service-packages` | ServicePackage | name | — |
| `/api/services` | Service | name, category | — |
| `/api/task-attachments` | TaskAttachment | fileName | — |
| `/api/task-checklists` | TaskChecklistItem | title | — |
| `/api/task-comments` | TaskComment | — | — |
| `/api/tasks` | Task | title | — |
| `/api/team-member-profiles` | TeamMemberProfile | title, department | — |
| `/api/users` | User | name, email | — |

For creating users, use `/api/auth/register-member`, not generic
`POST /api/users`, because the member route validates and hashes the password.

### Authentication APIs

| Method and path | Access | Capability |
| --- | --- | --- |
| `POST /api/auth/register` | Public | Create an organisation and its owner, hash password, create session. |
| `POST /api/auth/login` | Public | Validate credentials, update last login, issue session cookie. |
| `POST /api/auth/logout` | Public/session-aware | Delete session cookie. |
| `GET /api/auth/me` | Authenticated | Return session plus resolved permissions. |
| `PATCH /api/auth/me` | Authenticated | Update own name/email and optionally password; refresh session. |
| `POST /api/auth/change-password` | Authenticated | Verify current password and set a new one. |
| `POST /api/auth/register-member` | `users.post` | Add a member to the current organisation with a hashed password and role. |
| `POST /api/auth/seed` | Public in current code | Create or return the hard-coded seed owner and initial profiles. Development-only behavior; see risks below. |

### Access and settings APIs

| Method and path | Required permission | Capability |
| --- | --- | --- |
| `GET /api/access/roles` | `access.view` | Return roles, resources, actions, defaults, and active permission matrix. |
| `PATCH /api/access/roles` | `access.update` | Upsert custom permissions for a non-owner role. |
| `GET /api/settings` | `settings.view` | Return the current organisation. |
| `PATCH /api/settings` | `settings.update` | Update allowed organisation fields; cannot change ID, owner, or slug. |

### Dashboard and workspace APIs

| Method and path | Required permission | Capability |
| --- | --- | --- |
| `GET /api/dashboard/counts` | `dashboard.view` | Counts 23 record types plus open/overdue/pending/unread highlights and domain totals. |
| `GET /api/dashboard/owner` | `dashboard.view` plus resource permissions | Project health counts, pipeline, monthly revenue, outstanding invoices, overdue work. |
| `GET /api/dashboard/sales` | `dashboard.view` | Lead status/source metrics, weighted pipeline, proposal status/value, conversion rate, follow-ups. |
| `GET /api/dashboard/finance` | `finance.view` | Revenue, direct costs, gross profit/margin, invoice state, outstanding/overdue totals, profitability. |
| `GET /api/my-work` | Authenticated | Permission- and scope-aware personal task, finance, team, and compensation summary. |
| `GET /api/search?q=<text>` | Authenticated | Permission-aware global search. Queries under 2 characters return no results; maximum 80. |

### Reporting API

`GET /api/reports` requires `reports.view` plus view access to the selected
resource.

Supported query parameters:

```text
resource, page, limit, search, sort, order, dateField, from, to,
f_<filter>, min_<numericField>, max_<numericField>
```

The 23 report resources are leads, clients, proposals, projects, tasks,
invoices, payments, operational expenses, project expenses, users, team member
profiles, compensation profiles, project milestones, project members, financial
snapshots, services, service packages, boards, approvals, notifications, task
comments, task checklists, and task attachments.

### Custom workflow APIs

| Method and path | Required permission | Capability |
| --- | --- | --- |
| `POST /api/leads/:id/convert` | `leads.update` | Validate transition to won, create a client, mark lead won, and audit conversion. |
| `POST /api/proposals/:id/accept` | `proposals.update` | Validate acceptance, mark proposal accepted, create project and default Kanban board, and audit. |
| `GET /api/projects/:id/financials` | `project-expenses.view` | Aggregate labour cost, approved expenses, invoiced/paid/outstanding values, profit, margin, budget and hours usage. |
| `GET /api/projects/:id/health` | `projects.view` | Calculate health score, status, warnings, and category breakdown. |

### Health API

| Method and path | Capability |
| --- | --- |
| `GET /api/health` | Lightweight application liveness JSON. Does not query MongoDB. |
| `HEAD /api/health` | Database readiness check: 200 when MongoDB connects, 503 otherwise. |

## 8. Shared libraries and functions

### `lib/auth.ts`

- `encrypt(payload)` and `decrypt(token)` sign/verify session JWTs.
- `createSession(payload)`, `getSession()`, and `destroySession()` manage the
  session cookie.
- `requireAuth()` rejects unauthenticated calls.
- `requireAuthWithPermission(permission)` combines authentication and
  authorization.

### `lib/permissions.ts` and `lib/permission-store.ts`

- Builds the resource/action permission vocabulary.
- Defines role defaults and dashboard access rules.
- `hasPermission`, `isPermission`, and `isRole` validate access data.
- `getPermissionsForRole` loads organisation overrides or falls back to role
  defaults.
- `requirePermission` throws a typed authorization error when denied.

### `lib/data-scope.ts`

- Determines global versus member-level data access.
- Resolves related lead, client, project, and task IDs.
- `mergeDataScope` safely combines organisation filters with relationship
  filters.
- `createDataScopeResolver` caches scope calculations during a request.

### `lib/route-handler.ts`

- `createCrudHandlers` generates permission-aware collection GET/POST routes.
- `createDetailHandlers` generates permission-aware GET/PATCH/DELETE routes.
- Handles pagination, search, status filters, sorting, reference population,
  body normalization, actor defaults, organisation scope, audit entries, and
  structured logs.

### `lib/money.ts`

Provides:

- integer add, subtract, multiply, divide, and percentage helpers;
- gross profit and gross margin;
- risk- and margin-based project price;
- task cost from minutes and hourly cost;
- internal hourly cost;
- fully-loaded monthly employee cost;
- weighted pipeline value;
- Persian/Toman display formatting.

### State machines

`lib/state-machine.ts` validates transitions and returns allowed next states.
`lib/transitions.ts` declares maps for leads, proposals, projects, tasks, and
invoices. Currently, explicit enforcement is used by lead conversion and
proposal acceptance; generic PATCH endpoints do not automatically enforce all
declared transition maps.

### Reporting

`lib/report-definitions.ts` defines each report's search fields, date fields,
filters, columns, numeric summaries, permission, and default sort.
`GET /api/reports` applies those definitions to Mongoose queries and aggregate
pipelines.

### Infrastructure helpers

- `lib/db.ts`: cached Mongoose connection.
- `lib/api-response.ts`: uniform success/error responses.
- `lib/errors.ts`: typed application errors.
- `lib/correlation.ts`: request IDs using Nano ID or incoming headers.
- `lib/logger.ts`: JSON structured logs with configurable log level.
- `lib/audit.ts`: audit entry construction and persistence.
- `lib/use-crud.ts`: reusable React Query CRUD hook with cache invalidation and
  toast feedback.
- `lib/use-session.ts`: session/permission hook and role helpers.
- `lib/use-dashboard-metrics.ts`: cached/refetching count and owner metrics.

## 9. Reusable UI system

The frontend includes reusable components for:

- dynamic tables with sorting, responsive columns, actions, and empty/loading
  states;
- schema-driven dynamic forms;
- text, email, URL, telephone, number, percentage, currency, select, searchable
  select, checkbox, date, and textarea inputs;
- modals, detail modals, confirmation dialogs, and status pickers;
- badges, buttons, toasts, search-select controls, and date range selection;
- generic CRUD tabs with permission-aware Create/Edit/Delete controls;
- responsive sidebar, mobile bottom navigation, collapse preference, logout,
  navigation counts, and keyboard-friendly command palette.

The dashboard's 13 tabs are Dashboard, My Work, Profile, Leads, Clients,
Proposals, Projects, Tasks, Finance, Team, Reports, Access, and Settings.

## 10. Financial formulas

```text
Fully Loaded Monthly Cost =
  Salary + Employer Costs + Software + Equipment + Office + Management + Overhead

Internal Hourly Cost = Fully Loaded Monthly Cost / Realistic Billable Hours

Project Price = Estimated Cost * Risk Multiplier / (1 - Target Margin)

Gross Profit = Revenue - Direct Cost

Gross Margin = Gross Profit / Revenue * 100

Task Cost = Actual Minutes / 60 * Hourly Cost Snapshot

Weighted Pipeline = sum(Lead Value * Probability / 100)
```

Project health is a weighted score:

| Factor | Weight |
| --- | ---: |
| Schedule | 25% |
| Budget | 25% |
| Task completion | 20% |
| Quality/blocked tasks | 10% |
| Hours versus estimate | 10% |
| Capacity | 10% |

Scores are labeled healthy at 85+, at risk at 65–84, and critical below 65.
The capacity component is currently a constant 100 rather than a real capacity
calculation.

## 11. Audit, observability, and consistency

- Generic creates, updates, and deletes produce `AuditLog` entries.
- Lead conversion and proposal acceptance also produce audit entries.
- Logs are structured JSON with optional request, organisation, user, entity,
  action, duration, status, and error fields.
- API responses include a `requestId` for correlating client failures and logs.
- Duplicate keys, Mongoose validation failures, cast failures, and known
  application errors receive normalized responses.
- Compound indexes enforce important tenant-level uniqueness for users,
  projects, proposals, invoices, services, role permissions, and payments.

## 12. Deployment and operations

### Local development

```bash
npm install
npm run dev
```

The development server defaults to port 3000 and binds to `0.0.0.0`.

### Available package scripts

```text
npm run dev
npm run build
npm run start
npm run lint
```

### Docker

- Multi-stage build using Node 20 Alpine.
- Installs dependencies, builds the standalone Next.js server, and runs as a
  non-root `nextjs` user.
- Docker Compose exposes the application on `127.0.0.1:3080` and expects an
  external MongoDB URI through environment variables.
- Restart policy is `unless-stopped`.

## 13. Important limitations and risks

These are implementation observations, not merely roadmap items.

### Security and production hardening

- `POST /api/auth/seed` is reachable through the public `/api/auth` middleware
  prefix and contains hard-coded seed credentials. It should be disabled,
  protected, or removed before production deployment.
- `JWT_SECRET` falls back to a known development string when unset. Production
  startup should fail instead of using a fallback.
- No implemented rate limiter or explicit origin/CSRF validator was found,
  despite older architecture documentation claiming both.
- The Next.js 16 runtime warns that the `middleware.ts` convention is
  deprecated in favor of `proxy.ts`.

### Workflow and financial integrity

- Generic PATCH routes can directly change status fields without calling the
  declared state machines. Only the two custom conversion/acceptance workflows
  currently enforce transitions explicitly.
- Creating a payment does not automatically update invoice paid/outstanding
  amounts or invoice status.
- Invoice and proposal line-item totals are accepted from the client rather
  than recalculated server-side.
- Task actual cost, project actuals, and financial snapshots are not
  automatically synchronized by a time-entry/event system.
- The lead conversion route does not supply the required client `source` field,
  so it needs correction before it can reliably create a client.
- Proposal acceptance can assign a lead ID to `Project.clientId` when a client
  is absent. MongoDB accepts the ObjectId, but the reference is semantically a
  Client reference.

### Missing integrations and automation

- Task attachments store metadata only; no upload endpoint, signed URL flow,
  MIME validation, or Liara object-storage integration exists.
- Notifications are CRUD records; there is no email, SMS, push, or realtime
  delivery worker.
- Approval records exist, but approving/rejecting them does not automatically
  execute a linked domain action.
- No domain-event bus, background job queue, scheduled jobs, or n8n integration
  is implemented.

### Testing and documentation drift

- No test files, test framework dependencies, or `npm test` scripts are present.
  The existing testing document describes a desired strategy, not a runnable
  suite.
- Several older docs describe models such as time entries, change requests,
  marketing campaigns, capacity allocations, payroll, performance reviews,
  postmortems, content items, activity logs, domain events, and automation runs.
  Those models and APIs do not exist in the current source tree.
- The older architecture document describes a `src/modules` structure and
  server actions that are not used by the current repository.
- The roadmap's “Current State” says the project is greenfield, which is no
  longer true.

## 14. Schema-only or backend-heavy capabilities

Some features are represented by models and generic APIs but do not have a
dedicated full dashboard screen:

- services and service packages;
- boards as independently managed entities;
- project members and milestones;
- financial snapshots;
- approvals and notifications;
- task attachment metadata;
- audit logs, which have a model/helper but no public list API or dashboard.

They are usable through the API and, in many cases, the report system, but may
need purpose-built UI and workflow rules for a complete end-user experience.

## 15. Practical extension points

To add a fully protected resource consistently:

1. Add or update the Mongoose model with `organisationId` and indexes.
2. Add the resource to `ACCESS_RESOURCES` and role defaults.
3. Map the model to the resource in `lib/route-handler.ts`.
4. Add a non-admin data-scope rule in `lib/data-scope.ts`.
5. Create collection and detail Route Handlers with the CRUD factories.
6. Add explicit Zod validation for complex or security-sensitive writes.
7. Add report definitions and search integration if needed.
8. Add a dashboard tab or connect the resource to an existing detail view.
9. Add state transition and financial invariants outside generic PATCH logic.
10. Add automated tests for permissions, tenant isolation, validation, and
   workflow side effects.

## 16. Source files to read first

| Topic | Primary files |
| --- | --- |
| Authentication | `lib/auth.ts`, `middleware.ts`, `app/api/auth/*` |
| Roles and permissions | `lib/permissions.ts`, `lib/permission-store.ts`, `app/api/access/roles/route.ts` |
| Tenant and user scoping | `lib/data-scope.ts`, `lib/route-handler.ts` |
| Models | `models/*.ts` |
| Financial math | `lib/money.ts`, project financial and dashboard routes |
| State transitions | `lib/state-machine.ts`, `lib/transitions.ts` |
| Reports | `lib/report-definitions.ts`, `app/api/reports/route.ts` |
| Dashboard UI | `app/(dashboard)/dashboard/page.tsx`, `components/tabs/*` |
| Reusable UI | `components/ui/*`, `components/dashboard/crud-tab.tsx` |
| Deployment | `Dockerfile`, `docker-compose.yml`, `next.config.ts` |

