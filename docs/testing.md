# Testing Strategy

## Tools

| Type        | Tool       | Purpose                                  |
|-------------|------------|------------------------------------------|
| Unit        | Vitest     | Domain services, calculations, validators |
| Integration | Vitest     | API routes, server actions, DB operations |
| E2E         | Playwright | Critical user flows                       |

## Unit Test Coverage

Priority areas:
- Financial calculations (pricing, margin, hourly cost, task cost)
- State machine transitions (all entities)
- Permission checks
- Capacity calculations
- Project health scoring
- Validation schemas (Zod)
- Money utility functions

## Integration Test Coverage

- Lead → proposal conversion
- Proposal → project conversion
- Task time tracking flow
- Time approval → project cost update
- Change request approval → task unlock
- Invoice → payment → balance update
- Organisation data isolation (multi-tenant)

## E2E Test Coverage

Critical flows:
1. Login
2. Create lead
3. Create proposal from lead
4. Accept proposal (creates client + project)
5. Create task on project board
6. Assign task
7. Start/stop timer
8. Complete task
9. View project profitability
10. Create invoice
11. Record payment

## Test Organisation

```
src/
├── modules/
│   ├── finance/
│   │   └── services/
│   │       ├── pricing.service.ts
│   │       └── __tests__/
│   │           └── pricing.service.test.ts
│   └── ...
└── tests/
    ├── integration/
    │   ├── lead-conversion.test.ts
    │   ├── tenant-isolation.test.ts
    │   └── ...
    └── e2e/
        ├── auth.spec.ts
        ├── project-lifecycle.spec.ts
        └── ...
```

## Running Tests

```bash
# Unit + integration
npm test

# E2E
npm run test:e2e

# Coverage
npm run test:coverage
```
