# Entity Relationship Diagram

## Full System ER Diagram

```mermaid
erDiagram
    Organisation ||--o{ User : "has members"
    Organisation ||--o{ TeamMemberProfile : "has profiles"
    Organisation ||--o{ CompensationProfile : "has compensation"
    Organisation ||--o{ Lead : "tracks leads"
    Organisation ||--o{ Client : "has clients"
    Organisation ||--o{ Proposal : "creates proposals"
    Organisation ||--o{ Service : "offers services"
    Organisation ||--o{ Project : "runs projects"
    Organisation ||--o{ MarketingCampaign : "runs campaigns"
    Organisation ||--o{ Invoice : "issues invoices"
    Organisation ||--o{ OrganisationSetting : "has settings"

    User ||--o| TeamMemberProfile : "has profile"
    User ||--o{ CompensationProfile : "has cost history"
    User ||--o{ Lead : "owns leads"
    User ||--o{ TimeEntry : "logs time"
    User ||--o{ Notification : "receives"
    User ||--o{ CapacityAllocation : "allocated to"
    User ||--o{ TimeOff : "takes leave"
    User ||--o{ WorkingSchedule : "has schedule"

    Lead ||--o{ LeadActivity : "has activities"
    Lead ||--o| Proposal : "generates proposal"
    Lead ||--o| Client : "converts to client"

    Proposal ||--o| Project : "becomes project"
    Proposal }o--o{ Service : "uses services"

    Client ||--o{ Project : "has projects"
    Client ||--o{ Invoice : "billed via"

    Service ||--o{ ServicePackage : "has packages"

    Project ||--o{ ProjectMember : "has team"
    Project ||--o{ ProjectMilestone : "has milestones"
    Project ||--o{ Board : "has boards"
    Project ||--o{ Task : "contains tasks"
    Project ||--o{ TimeEntry : "tracks time"
    Project ||--o{ ChangeRequest : "has changes"
    Project ||--o{ ProjectExpense : "has expenses"
    Project ||--o{ Invoice : "invoiced via"
    Project ||--o| ProjectPostmortem : "reviewed in"
    Project ||--o{ FinancialSnapshot : "snapshot of"

    Board ||--o{ Task : "organizes tasks"

    Task ||--o{ TaskComment : "has comments"
    Task ||--o{ TaskChecklistItem : "has checklist"
    Task ||--o{ TaskAttachment : "has files"
    Task ||--o{ TimeEntry : "tracked in"
    Task ||--o| ChangeRequest : "linked to CR"
    Task ||--o{ Task : "depends on"

    Invoice ||--o{ Payment : "receives payments"

    MarketingCampaign ||--o{ ContentItem : "has content"
    MarketingCampaign ||--o{ CampaignMetric : "tracks metrics"

    ContentItem ||--o{ ContentVersion : "has versions"

    DomainEvent ||--o{ AutomationRun : "triggers"
    AutomationDefinition ||--o{ AutomationRun : "executed as"
```

## Sales Engine Flow

```mermaid
flowchart LR
    A[Lead] -->|qualify| B[Proposal]
    B -->|accept| C[Client]
    B -->|accept| D[Project]
    C --- D
    A -->|activities| E[LeadActivity]

    style A fill:#007aff,color:#fff
    style B fill:#ff9500,color:#fff
    style C fill:#34c759,color:#fff
    style D fill:#34c759,color:#fff
    style E fill:#8e8e93,color:#fff
```

## Delivery Engine Flow

```mermaid
flowchart TD
    P[Project] --> PM[ProjectMember]
    P --> ML[ProjectMilestone]
    P --> B[Board]
    B --> T[Task]
    T --> TE[TimeEntry]
    T --> TC[TaskComment]
    T --> TK[TaskChecklist]
    T --> TA[TaskAttachment]
    P --> CR[ChangeRequest]
    CR -.->|creates| T
    P --> PP[ProjectPostmortem]

    style P fill:#007aff,color:#fff
    style T fill:#ff9500,color:#fff
    style TE fill:#34c759,color:#fff
    style CR fill:#ff3b30,color:#fff
```

## Finance Engine Flow

```mermaid
flowchart LR
    CP[CompensationProfile] -->|hourly cost| TE[TimeEntry]
    TE -->|actual cost| T[Task]
    T -->|sum costs| P[Project]
    PE[ProjectExpense] --> P
    P -->|revenue - cost| PR[Profit]
    P --> I[Invoice]
    I --> PAY[Payment]
    P --> FS[FinancialSnapshot]

    style CP fill:#ff9500,color:#fff
    style PR fill:#34c759,color:#fff
    style I fill:#007aff,color:#fff
```

## Marketing Engine Flow

```mermaid
flowchart TD
    MC[MarketingCampaign] --> CI[ContentItem]
    CI --> CV[ContentVersion]
    MC --> CM[CampaignMetric]
    MC -.->|generates| L[Lead]

    style MC fill:#007aff,color:#fff
    style CI fill:#ff9500,color:#fff
    style L fill:#34c759,color:#fff
```

## Capacity Engine Flow

```mermaid
flowchart LR
    WS[WorkingSchedule] -->|available hours| CAP[Capacity Calc]
    TO[TimeOff] -->|subtract| CAP
    CA[CapacityAllocation] -->|assigned| CAP
    CAP -->|utilisation %| DASH[Dashboard]

    style CAP fill:#ff9500,color:#fff
    style DASH fill:#34c759,color:#fff
```

---

## Model Responsibilities

### Identity & Organisation

| Model | Responsibility |
|-------|---------------|
| **Organisation** | Tenant boundary. Holds settings (currency, timezone, capacity split, billable %). Every entity scoped to one org. |
| **User** | Authentication identity. Email + password hash. Role assignment. Linked to one org. |
| **TeamMemberProfile** | Employment details: title, department, skills, employment type, weekly capacity. |
| **CompensationProfile** | Salary + all cost allocations. Computes fully-loaded monthly cost and internal hourly cost. Versioned for historical accuracy. |

### Sales

| Model | Responsibility |
|-------|---------------|
| **Lead** | Potential opportunity. Tracks source, value, probability, follow-up dates, status lifecycle. |
| **LeadActivity** | Interaction log (calls, emails, meetings, notes) — stored separately, not embedded. |
| **Client** | Converted lead or direct client. Contact + billing info. Links to org. |
| **Proposal** | Priced offer with line items from service catalogue. Tracks expected cost, profit, margin. Status lifecycle with state machine. |

### Service Catalogue

| Model | Responsibility |
|-------|---------------|
| **Service** | Standardized offering: pricing type, hour estimates, margin target, risk %, revision limits, required roles. |
| **ServicePackage** | Tiered packaging (Basic/Standard/Premium/Custom) for a service. |

### Delivery

| Model | Responsibility |
|-------|---------------|
| **Project** | Primary work unit. Contract value, budget, timeline, health score, financial actuals. Status lifecycle. |
| **ProjectMember** | User ↔ Project link with billing rate and cost snapshots at assignment time. |
| **ProjectMilestone** | Deliverable checkpoints with dates and optional invoice triggers. |
| **Board** | Kanban board with ordered columns and WIP limits. |
| **Task** | Work item. Classifies type (original scope, bug, revision, etc.). Tracks estimated/actual cost via hourly cost snapshots. |
| **TaskChecklistItem** | Sub-items within a task. |
| **TaskComment** | Discussion thread on tasks (separate collection). |
| **TaskAttachment** | Files attached to tasks. |
| **TimeEntry** | Time logged against a task. Stores hourly cost snapshot at time of work. Approval workflow. |
| **ChangeRequest** | Scope change with estimated cost/price. Must be approved before related tasks can start. |
| **ProjectPostmortem** | Post-project analysis: estimated vs actual, lessons learned. |

### Capacity

| Model | Responsibility |
|-------|---------------|
| **CapacityAllocation** | Planned weekly hours per user per category (delivery, marketing, internal, buffer). |
| **TimeOff** | Leave/vacation records. Subtracts from available capacity. |
| **WorkingSchedule** | Weekly working hours, working days, daily start/end times per user. |

### Finance

| Model | Responsibility |
|-------|---------------|
| **ProjectExpense** | Non-labour project costs (software, hosting, contractor fees). |
| **Invoice** | Billing document with line items. Tracks paid/outstanding amounts. Status lifecycle. |
| **Payment** | Individual payment against an invoice. Idempotency key prevents duplicates. |
| **PayrollPeriod** | Monthly payroll snapshot for org-level cost tracking. |
| **PerformanceReview** | Periodic employee performance assessment with scoring. |
| **FinancialSnapshot** | Point-in-time capture of financial metrics. Prevents recalculating from raw data on every request. |

### Marketing

| Model | Responsibility |
|-------|---------------|
| **MarketingCampaign** | Marketing initiative: objective, channels, budget, targets, status lifecycle. |
| **ContentItem** | Content piece within a campaign. Status lifecycle through content pipeline. |
| **ContentVersion** | Version history for content items. |
| **CampaignMetric** | Tracked metrics: impressions, clicks, leads, conversions, spend, revenue. |

### Platform

| Model | Responsibility |
|-------|---------------|
| **ApprovalRequest** | Generic approval workflow for any entity. |
| **Notification** | In-app notifications with read status. |
| **AuditLog** | Immutable record of important changes (actor, action, old/new values, timestamp, IP). |
| **ActivityLog** | Lightweight activity feed for entity timelines. |
| **OrganisationSetting** | Key-value configuration at tenant level. |

### Automation (Future)

| Model | Responsibility |
|-------|---------------|
| **DomainEvent** | Stored events for audit and future external dispatch. Includes idempotency key and processing status. |
| **AutomationDefinition** | Trigger → action definition (inactive until n8n integration). |
| **AutomationRun** | Execution record of an automation triggered by a domain event. |
