# Implementation Roadmap

## Current State

Fresh Next.js 16.2.9 scaffold. No custom code, no database, no authentication. Everything is greenfield.

## Phase Plan

### Phase 0: Repository Analysis and Planning ✅
- Inspect repository structure
- Document architecture decisions
- Create domain model documentation
- Establish implementation roadmap

**Status: Complete**

---

### Phase 1: Core Foundation
**Goal:** Authentication, organisation multi-tenancy, permission system, and application shell.

**Dependencies to install:**
- `mongoose` - MongoDB ODM
- `zod` - Validation
- `bcryptjs` + `@types/bcryptjs` - Password hashing
- `jose` - JWT handling (Edge-compatible)
- `nanoid` - ID generation

**Models:** Organisation, User, Role, TeamMemberProfile, AuditLog

**Infrastructure:**
- MongoDB connection singleton
- Structured logger with correlation IDs
- Typed error classes
- Permission system
- Audit log helper
- Money utility
- API response helpers
- Zod validation helpers

**UI:**
- Login / Register pages
- Dashboard shell with sidebar navigation
- Organisation context provider

**Acceptance:**
- User can register and log in
- User belongs to an organisation
- Routes are permission-protected
- Organisation isolation verified
- Audit logs generated for important actions
- Consistent error response format

---

### Phase 2: Service Catalogue
**Goal:** Standardised service offerings with pricing and margin configuration.

**Models:** Service, ServicePackage

**UI:** Service list, service detail, create/edit forms

**Acceptance:**
- Services can be created, edited, activated, archived
- Packages calculate expected margin
- Invalid financial values rejected

---

### Phase 3: Sales CRM
**Goal:** Lead management, proposal builder, pipeline tracking, lead conversion.

**Models:** Lead, LeadActivity, Client, Proposal

**UI:** Lead pipeline board, lead detail, proposal builder, sales dashboard

**Acceptance:**
- Lead status transitions validated
- Proposal uses service packages
- Proposal shows cost/profit/margin
- Accepted proposal creates client + project
- Conversion is idempotent

---

### Phase 4: Project Management
**Goal:** Project lifecycle, team management, timeline tracking.

**Models:** Project, ProjectMember, ProjectMilestone

**UI:** Project list, project detail, team management, status transitions

**Acceptance:**
- Organisation-scoped projects
- Status transitions validated
- Financial fields permission-protected

---

### Phase 5: Task System (Kanban)
**Goal:** Trello-like boards with drag-and-drop, task lifecycle, dependencies.

**Dependencies to install:**
- `@dnd-kit/core` + `@dnd-kit/sortable` - Drag and drop

**Models:** Board, BoardColumn, Task, TaskChecklistItem, TaskComment, TaskAttachment

**UI:** Kanban board, task detail modal, filters, search

**Acceptance:**
- Task transitions validated
- Drag-and-drop updates order safely
- Concurrent moves don't corrupt ordering
- Change-request tasks blocked until approval

---

### Phase 6: Time Tracking
**Goal:** Timer, manual entries, approval workflow, timesheets.

**Models:** TimeEntry

**UI:** Timer widget, timesheet, approval interface

**Acceptance:**
- One active timer per user
- Approved time updates task/project actuals
- Historical hourly cost snapshot stored

---

### Phase 7: Capacity Planning
**Goal:** Workload visibility, utilisation tracking, project acceptance checks.

**Models:** WorkingSchedule, TimeOff, CapacityAllocation

**UI:** Team workload dashboard, capacity previews, warnings

**Acceptance:**
- Available capacity excludes time off
- Assignments reduce availability
- Colour-coded capacity status
- Project acceptance check functional

---

### Phase 8: Financial Engine
**Goal:** Cost tracking, profitability calculations, financial dashboards.

**Models:** CompensationProfile, ProjectExpense, FinancialSnapshot

**UI:** Finance dashboard, project profitability, financial warnings

**Acceptance:**
- Historical costs stable after salary changes
- Task costs match approved time entries
- Financial formulas have unit tests
- Salary data permission-restricted

---

### Phase 9: Change Requests
**Goal:** Scope control with pricing, approval, and audit trail.

**Models:** ChangeRequest

**UI:** Change request form, approval flow, scope-creep reporting

**Acceptance:**
- Unapproved work cannot start (unless overridden with audit)
- Financial impact reflected in project reports

---

### Phase 10: Invoices and Payments
**Goal:** Billing, payment tracking, overdue detection.

**Models:** Invoice, Payment

**UI:** Invoice builder, payment recording, client statements

**Acceptance:**
- Payment updates balance
- Duplicate payments prevented
- Overdue detection working

---

### Phase 11: Project Health and Reporting
**Goal:** Health scores, dashboards for all roles, reporting.

**Models:** ProjectPostmortem, PerformanceReview, PayrollPeriod

**Services:** ProjectHealthService

**UI:** Owner/PM/Employee/Sales/Finance dashboards

**Acceptance:**
- Every active project has a health score
- Dashboard totals match source data

---

### Phase 12: Marketing Engine
**Goal:** Campaign management, content pipeline, marketing continuity.

**Models:** MarketingCampaign, ContentItem, ContentVersion, CampaignMetric

**UI:** Campaign CRUD, content pipeline, marketing dashboard

**Acceptance:**
- Content moves through valid states
- Marketing work appears in capacity planning
- Owner warned when marketing stops

---

### Phase 13: Notifications and Approvals
**Goal:** In-app notifications, approval workflows.

**Models:** ApprovalRequest, Notification

**UI:** Notification centre, approval dashboard

**Acceptance:**
- Unread notifications visible
- Approvals permission-checked and audited

---

### Phase 14: Automation Preparation
**Goal:** Clean integration boundaries for future n8n.

**Models:** DomainEvent, AutomationDefinition, AutomationRun

**No external integration yet.** Events stored, not dispatched externally.

---

### Phase 15: Production Hardening
**Goal:** Docker, health checks, security review, e2e tests.

**Deliverables:**
- Dockerfile + docker-compose.yml
- Environment validation
- Health/readiness endpoints
- Rate limiting
- Secure headers
- E2e test suite
- Performance review
