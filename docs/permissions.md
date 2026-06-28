# Permissions

## Role Hierarchy

| Role            | Description                                    |
|-----------------|------------------------------------------------|
| Owner           | Full access to everything                      |
| Admin           | Organisation management, all operational areas |
| Project Manager | Project, task, team, and capacity management   |
| Developer       | Task work, time tracking, own assignments      |
| Designer        | Task work, time tracking, own assignments      |
| Sales           | Lead and proposal management                   |
| Marketing       | Campaign and content management                |
| Finance         | Invoice, payment, and financial reporting      |
| Client          | View own projects, approve deliverables        |

## Permission Constants

### Organisation
- `organisation.manage` - Edit organisation settings
- `team.view` - View team members
- `team.manage` - Add/remove/edit team members
- `salary.view` - View compensation data
- `salary.manage` - Edit compensation data

### Sales
- `lead.create` - Create new leads
- `lead.view` - View leads
- `lead.update` - Edit lead details
- `lead.assign` - Assign lead ownership
- `lead.convert` - Convert lead to client

### Proposals
- `proposal.create` - Create proposals
- `proposal.send` - Send proposals to clients
- `proposal.approve` - Approve proposals

### Projects
- `project.create` - Create projects
- `project.view` - View projects
- `project.update` - Edit project details
- `project.archive` - Archive projects
- `project.view_finance` - View project financial data

### Tasks
- `task.create` - Create tasks
- `task.assign` - Assign tasks to team members
- `task.update` - Edit task details
- `task.review` - Review and approve tasks
- `task.delete` - Delete tasks

### Time
- `time.create` - Log time entries
- `time.approve` - Approve/reject time entries

### Finance
- `finance.view` - View financial reports
- `finance.manage` - Manage financial settings
- `invoice.create` - Create invoices
- `invoice.approve` - Approve invoices
- `payment.record` - Record payments

### Marketing
- `campaign.create` - Create campaigns
- `campaign.approve` - Approve campaigns
- `campaign.publish` - Publish content

### Platform
- `report.view` - View reports
- `audit.view` - View audit logs

## Default Role Mappings

| Permission          | Owner | Admin | PM  | Dev | Design | Sales | Marketing | Finance | Client |
|---------------------|-------|-------|-----|-----|--------|-------|-----------|---------|--------|
| organisation.manage | ✓     | ✓     |     |     |        |       |           |         |        |
| team.view           | ✓     | ✓     | ✓   |     |        |       |           |         |        |
| team.manage         | ✓     | ✓     |     |     |        |       |           |         |        |
| salary.view         | ✓     | ✓     |     |     |        |       |           | ✓       |        |
| salary.manage       | ✓     |       |     |     |        |       |           |         |        |
| lead.create         | ✓     | ✓     |     |     |        | ✓     |           |         |        |
| lead.view           | ✓     | ✓     | ✓   |     |        | ✓     |           |         |        |
| lead.update         | ✓     | ✓     |     |     |        | ✓     |           |         |        |
| lead.assign         | ✓     | ✓     |     |     |        | ✓     |           |         |        |
| lead.convert        | ✓     | ✓     |     |     |        | ✓     |           |         |        |
| proposal.create     | ✓     | ✓     | ✓   |     |        | ✓     |           |         |        |
| proposal.send       | ✓     | ✓     |     |     |        | ✓     |           |         |        |
| proposal.approve    | ✓     | ✓     |     |     |        |       |           |         |        |
| project.create      | ✓     | ✓     | ✓   |     |        |       |           |         |        |
| project.view        | ✓     | ✓     | ✓   | ✓   | ✓      |       |           |         | ✓      |
| project.update      | ✓     | ✓     | ✓   |     |        |       |           |         |        |
| project.archive     | ✓     | ✓     |     |     |        |       |           |         |        |
| project.view_finance| ✓     | ✓     | ✓   |     |        |       |           | ✓       |        |
| task.create         | ✓     | ✓     | ✓   | ✓   | ✓      |       |           |         |        |
| task.assign         | ✓     | ✓     | ✓   |     |        |       |           |         |        |
| task.update         | ✓     | ✓     | ✓   | ✓   | ✓      |       |           |         |        |
| task.review         | ✓     | ✓     | ✓   |     |        |       |           |         |        |
| task.delete         | ✓     | ✓     | ✓   |     |        |       |           |         |        |
| time.create         | ✓     | ✓     | ✓   | ✓   | ✓      | ✓     | ✓         |         |        |
| time.approve        | ✓     | ✓     | ✓   |     |        |       |           |         |        |
| finance.view        | ✓     | ✓     |     |     |        |       |           | ✓       |        |
| finance.manage      | ✓     | ✓     |     |     |        |       |           | ✓       |        |
| invoice.create      | ✓     | ✓     |     |     |        |       |           | ✓       |        |
| invoice.approve     | ✓     | ✓     |     |     |        |       |           |         |        |
| payment.record      | ✓     | ✓     |     |     |        |       |           | ✓       |        |
| campaign.create     | ✓     | ✓     |     |     |        |       | ✓         |         |        |
| campaign.approve    | ✓     | ✓     |     |     |        |       |           |         |        |
| campaign.publish    | ✓     | ✓     |     |     |        |       | ✓         |         |        |
| report.view         | ✓     | ✓     | ✓   |     |        |       |           | ✓       |        |
| audit.view          | ✓     | ✓     |     |     |        |       |           |         |        |

## Implementation Pattern

```typescript
await requirePermission({
  user,
  permission: 'project.view_finance',
  organisationId,
});
```

Throws `AuthorizationError` if the user lacks the required permission.
