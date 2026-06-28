# Domain Model

## Entity Relationship Overview

```
Organisation ─┬── User ── Role
              ├── TeamMemberProfile ── CompensationProfile
              │
              ├── Lead ── LeadActivity
              │    └── Proposal
              │         └── Client
              │              └── Project
              │                   ├── ProjectMember
              │                   ├── ProjectMilestone
              │                   ├── Board ── BoardColumn
              │                   │              └── Task
              │                   │                   ├── TaskChecklistItem
              │                   │                   ├── TaskComment
              │                   │                   ├── TaskAttachment
              │                   │                   └── TimeEntry
              │                   ├── ChangeRequest
              │                   ├── ProjectExpense
              │                   ├── Invoice ── Payment
              │                   └── ProjectPostmortem
              │
              ├── Service ── ServicePackage
              │
              ├── CapacityAllocation
              ├── TimeOff
              ├── WorkingSchedule
              │
              ├── MarketingCampaign
              │    ├── ContentItem ── ContentVersion
              │    └── CampaignMetric
              │
              ├── ApprovalRequest
              ├── Notification
              ├── AuditLog
              ├── ActivityLog
              │
              ├── FinancialSnapshot
              ├── PayrollPeriod
              ├── PerformanceReview
              │
              ├── SystemSetting
              ├── OrganisationSetting
              │
              └── (Future) AutomationDefinition
                   └── AutomationRun
                        └── DomainEvent
```

## Core Entities

### Organisation
The tenant boundary. Every entity belongs to exactly one organisation.

### User
Authentication identity. Linked to one or more organisations through roles.

### Role
Named permission set. Built-in roles: Owner, Admin, Project Manager, Developer, Designer, Sales, Marketing, Finance, Client.

### TeamMemberProfile
Employment details for internal team members: title, department, skills, working schedule, start date.

### CompensationProfile
Salary and cost allocation. Stored separately for strict permission control. Includes snapshots for historical accuracy.

## Sales Domain

### Lead
A potential client/opportunity. Tracks source, estimated value, probability, status, follow-up dates.

**Status flow:** `new → contacted → qualified → proposal_sent → negotiation → won | lost`

### LeadActivity
Separate collection for lead interactions: calls, emails, meetings, notes.

### Client
A converted lead or directly created client. Links to organisation, contact details, billing info.

### Proposal
A priced offer to a lead/client. Contains line items built from service catalogue. Tracks expected cost, profit, margin.

**Status flow:** `draft → sent → viewed → accepted | rejected | expired | cancelled`

## Service Catalogue

### Service
Standardised offering: name, category, deliverables, pricing type, hour estimates, target margin, risk percentage, revision limits, required roles.

### ServicePackage
Tiered packaging (Basic/Standard/Premium/Custom) for a service with specific pricing and scope.

## Delivery Domain

### Project
The primary work unit. Created from an accepted proposal or manually. Tracks contract value, budget, timeline, health score, team, financial actuals.

**Status flow:** `planned → active → on_hold → client_review → completed | cancelled`

### ProjectMember
Links users to projects with specific roles and billing rate snapshots.

### ProjectMilestone
Deliverable checkpoints with dates, completion status, and optional invoice triggers.

### Board
Kanban board belonging to a project. Contains ordered columns.

### BoardColumn
A column within a board: name, order, WIP limit.

### Task
Work item within a board column. Classifies work type (original scope, bug, client revision, paid change, internal rework, etc.).

**Status flow:** `backlog → todo → in_progress → review → done` (with `blocked` from any active state)

**Fields:** title, description, project, board, column, parent task, assignees, reporter, reviewer, priority, status, type, complexity points, estimated/actual minutes, cost snapshots, billable status, dates, dependencies, tags, revision count, checklist, comments, attachments, activity history.

### TaskChecklistItem
Sub-items within a task.

### TaskComment
Discussion thread on tasks.

### TaskAttachment
Files attached to tasks.

### TimeEntry
Time logged against a task. Stores duration, hourly cost snapshot, calculated cost, billable status, approval status.

**Status flow:** `draft → submitted → approved | rejected`

### ChangeRequest
Scope change with estimated hours, cost, selling price, approval status. Links to generated tasks.

**Status flow:** `draft → pending_approval → approved | rejected`

### ProjectPostmortem
Post-project analysis: what went well, what didn't, lessons learned, actual vs estimated metrics.

## Capacity Domain

### CapacityAllocation
Planned capacity split: delivery %, sales/marketing %, internal %, emergency buffer %.

### TimeOff
Leave/vacation records per team member.

### WorkingSchedule
Weekly working hours per team member, including default capacity.

## Finance Domain

### ProjectExpense
Non-labour costs on a project: software, hosting, contractor fees, etc.

### Invoice
Billing document. Tracks items, amounts, status, due dates.

**Status flow:** `draft → sent → partially_paid → paid | overdue | cancelled`

### Payment
Individual payment against an invoice. Amount, date, method, reference.

### PayrollPeriod
Monthly payroll snapshot for cost tracking.

### PerformanceReview
Periodic employee performance assessment.

### FinancialSnapshot
Point-in-time capture of financial metrics for dashboards and historical reporting.

## Marketing Domain

### MarketingCampaign
Planned marketing initiative: objective, channels, budget, dates, targets, metrics.

**Status flow:** `draft → planned → active → completed | cancelled`

### ContentItem
A piece of content within a campaign.

**Status flow:** `idea → brief → drafting → review → approved → scheduled → published | failed | archived`

### ContentVersion
Version history for content items.

### CampaignMetric
Tracked metrics: impressions, clicks, leads, conversions, spend.

## Platform Entities

### ApprovalRequest
Generic approval workflow: entity type, entity ID, approver, status, decision.

### Notification
In-app notification with read status.

### AuditLog
Immutable record of important changes: actor, action, entity, old/new values, timestamp, IP.

### ActivityLog
Lightweight activity feed for entity timelines.

### SystemSetting / OrganisationSetting
Configuration at system and tenant level.

## Financial Formulas

### Employee Internal Hourly Cost
```
Fully Loaded Monthly Cost = Salary + Employer Costs + Software + Equipment + Office + Management + Overhead
Internal Hourly Cost = Fully Loaded Monthly Cost / Realistic Billable Hours
```

### Project Pricing
```
Project Price = Estimated Cost × Risk Multiplier / (1 - Target Margin)
```

### Profitability
```
Gross Profit = Revenue - Direct Cost
Gross Margin = (Gross Profit / Revenue) × 100
```

### Task Cost
```
Task Actual Cost = Actual Time × Hourly Cost Snapshot
```

## Money Representation

All monetary values stored as integers in the smallest practical unit.
Example: `1,000,000 toman = 1000000` (stored as integer).

No floating-point arithmetic for financial calculations.
