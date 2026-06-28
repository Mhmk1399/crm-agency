# State Machines

All entity status changes must go through transition services. No direct status updates.

## Lead

```
new → contacted → qualified → proposal_sent → negotiation → won
                                                           → lost
```

Valid transitions:
```
new:           [contacted]
contacted:     [qualified, lost]
qualified:     [proposal_sent, lost]
proposal_sent: [negotiation, lost]
negotiation:   [won, lost]
won:           []
lost:          []
```

## Proposal

```
draft → sent → viewed → accepted
                      → rejected
        sent → accepted
             → rejected
draft → cancelled
sent  → expired
```

Valid transitions:
```
draft:     [sent, cancelled]
sent:      [viewed, accepted, rejected, expired]
viewed:    [accepted, rejected]
accepted:  []
rejected:  []
cancelled: []
expired:   []
```

## Project

```
planned → active → on_hold → active
                 → client_review → active
                                 → completed
planned → cancelled
active  → cancelled
```

Valid transitions:
```
planned:       [active, cancelled]
active:        [on_hold, client_review, cancelled]
on_hold:       [active]
client_review: [active, completed]
completed:     []
cancelled:     []
```

## Task

```
backlog → todo → in_progress → review → done
                                      → in_progress (rejected)
any active state → blocked
blocked → todo
blocked → in_progress
```

Valid transitions:
```
backlog:     [todo]
todo:        [in_progress, blocked]
in_progress: [review, blocked]
review:      [in_progress, done, blocked]
blocked:     [todo, in_progress]
done:        []
```

## Time Entry

```
draft → submitted → approved
                  → rejected → draft
```

Valid transitions:
```
draft:     [submitted]
submitted: [approved, rejected]
approved:  []
rejected:  [draft]
```

## Invoice

```
draft → sent → partially_paid → paid
             → paid
             → overdue
      → cancelled
partially_paid → paid
               → overdue
```

Valid transitions:
```
draft:          [sent, cancelled]
sent:           [partially_paid, paid, overdue]
partially_paid: [paid, overdue]
paid:           []
overdue:        [partially_paid, paid]
cancelled:      []
```

## Change Request

```
draft → pending_approval → approved → tasks_created
                         → rejected
```

Valid transitions:
```
draft:            [pending_approval]
pending_approval: [approved, rejected]
approved:         []
rejected:         []
```

## Content Item

```
idea → brief → drafting → review → approved → scheduled → published
                                 → rejected → drafting (revision)
```

Valid transitions:
```
idea:      [brief]
brief:     [drafting]
drafting:  [review]
review:    [approved, drafting]
approved:  [scheduled]
scheduled: [published, failed]
published: [archived]
failed:    [drafting]
archived:  []
```

## Marketing Campaign

```
draft → planned → active → completed
                         → cancelled
draft → cancelled
```

Valid transitions:
```
draft:     [planned, cancelled]
planned:   [active, cancelled]
active:    [completed, cancelled]
completed: []
cancelled: []
```
