# ADR-003: Money Handling

## Status
Accepted

## Context
Financial calculations are core to the system. JavaScript floating-point arithmetic is unreliable for money.

## Decision
Store all monetary values as **integers in the smallest practical unit** (1 unit = 1 toman). Use a shared `money` utility module for all arithmetic.

## Rationale
- Integer arithmetic eliminates floating-point rounding errors.
- A single utility module ensures consistent handling across all services.
- Display formatting is handled at the presentation layer only.

## Consequences
- All financial inputs must be converted to integers at the boundary.
- Division operations must use proper rounding (Math.round, not Math.floor).
- Display layer must format integers back to human-readable amounts.
- All financial formulas must go through the money utility.

## Example
```
1,000,000 toman → stored as 1000000 (integer)
Project price calculation: estimatedCost * riskMultiplier / (1 - targetMargin)
All intermediate results kept as integers with explicit rounding.
```
