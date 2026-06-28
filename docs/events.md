# Domain Events

## Event Structure

```typescript
{
  id: string;           // Unique event ID (nanoid)
  organisationId: string;
  type: string;         // e.g., "lead.created"
  entityType: string;   // e.g., "Lead"
  entityId: string;
  occurredAt: string;   // ISO 8601 timestamp
  payload: Record<string, unknown>;
  version: number;      // Schema version for evolution
}
```

## Event Catalogue

### Sales Events
| Event               | Trigger                          |
|---------------------|----------------------------------|
| lead.created        | New lead added                   |
| lead.qualified      | Lead status → qualified          |
| lead.converted      | Lead converted to client         |
| lead.lost           | Lead marked as lost              |
| proposal.created    | New proposal drafted             |
| proposal.sent       | Proposal sent to client          |
| proposal.accepted   | Client accepts proposal          |
| proposal.rejected   | Client rejects proposal          |

### Delivery Events
| Event               | Trigger                          |
|---------------------|----------------------------------|
| project.created     | New project created              |
| project.started     | Project status → active          |
| project.completed   | Project status → completed       |
| project.margin_warning | Actual margin drops below target |
| task.created        | New task created                 |
| task.assigned       | Task assigned to team member     |
| task.started        | Task status → in_progress        |
| task.blocked        | Task status → blocked            |
| task.completed      | Task status → done               |

### Time Events
| Event               | Trigger                          |
|---------------------|----------------------------------|
| time_entry.submitted | Time entry submitted for review |
| time_entry.approved  | Time entry approved             |
| time_entry.rejected  | Time entry rejected             |

### Change Management Events
| Event                     | Trigger                     |
|---------------------------|-----------------------------|
| change_request.created    | New change request           |
| change_request.approved   | Change request approved      |
| change_request.rejected   | Change request rejected      |

### Finance Events
| Event               | Trigger                          |
|---------------------|----------------------------------|
| invoice.created     | New invoice created              |
| invoice.sent        | Invoice sent to client           |
| invoice.overdue     | Invoice past due date            |
| payment.received    | Payment recorded                 |

### Marketing Events
| Event               | Trigger                          |
|---------------------|----------------------------------|
| campaign.created    | New campaign created             |
| campaign.started    | Campaign status → active         |
| campaign.completed  | Campaign status → completed      |
| content.approved    | Content item approved            |
| content.published   | Content item published           |

## Current Handling

Events are emitted and handled internally within the application. They are stored in the DomainEvent collection for audit and future replay.

## Future Integration

When n8n integration is added, events will be dispatched to an external webhook/queue. The DomainEvent collection serves as the outbox. Events include idempotency keys to prevent duplicate processing.
