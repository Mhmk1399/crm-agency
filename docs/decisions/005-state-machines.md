# ADR-005: State Machine Pattern

## Status
Accepted

## Context
Entities like leads, proposals, projects, tasks, and invoices have well-defined lifecycle states. Arbitrary status updates can corrupt data and bypass business rules.

## Decision
Use **explicit state-transition maps** validated by transition services. No arbitrary status updates.

## Rationale
- A transition map is a simple data structure: `Record<Status, Status[]>` that lists valid next states.
- Transition services validate the move, execute side effects, and emit domain events.
- UI can query valid transitions to only show allowed actions.

## Implementation Pattern
```typescript
const PROPOSAL_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['viewed', 'accepted', 'rejected', 'expired'],
  viewed: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
  cancelled: [],
  expired: [],
};

function validateTransition(current: Status, next: Status): boolean {
  return PROPOSAL_TRANSITIONS[current]?.includes(next) ?? false;
}
```

## Consequences
- Every status change must go through the transition service.
- Direct database updates to status fields are forbidden outside transition services.
- New statuses require updating the transition map.
