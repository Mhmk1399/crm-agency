# Financial Formulas

All monetary values are stored as integers in the smallest unit (1 unit = 1 toman).

## Employee Internal Hourly Cost

```
Fully Loaded Monthly Cost =
  Salary
  + Employer Costs (insurance, taxes)
  + Software Allocation
  + Equipment Allocation
  + Office Allocation
  + Management Allocation
  + Other Overhead

Internal Hourly Cost = Fully Loaded Monthly Cost / Realistic Billable Hours
```

**Important:** Do not divide by total working hours. Use realistic billable capacity (typically 70-80% of working hours).

Example:
```
Monthly salary: 50,000,000
Employer costs: 11,500,000
Software: 2,000,000
Equipment: 1,500,000
Office: 3,000,000
Management: 2,000,000
Overhead: 1,000,000

Fully loaded: 71,000,000
Realistic billable hours: 120 (out of ~176 total)
Internal hourly cost: 591,667 (rounded)
```

## Project Pricing

```
Project Price = Estimated Cost × Risk Multiplier / (1 - Target Margin)
```

Example:
```
Estimated cost: 100,000,000
Risk multiplier: 1.20
Target margin: 50% (0.50)

Price = 100,000,000 × 1.20 / (1 - 0.50)
      = 120,000,000 / 0.50
      = 240,000,000
```

## Task Cost

```
Task Estimated Cost = Estimated Minutes / 60 × Internal Hourly Cost Snapshot
Task Actual Cost = Actual Minutes / 60 × Hourly Cost Snapshot (at time of work)
```

## Project Profitability

```
Estimated Labour Cost = Σ (Task Estimated Cost)
Actual Labour Cost = Σ (Task Actual Cost)  [from approved time entries]
Total Actual Cost = Actual Labour Cost + Project Expenses

Expected Profit = Contract Value - Budgeted Cost
Actual Profit = Contract Value - Total Actual Cost

Expected Margin = (Expected Profit / Contract Value) × 100
Actual Margin = (Actual Profit / Contract Value) × 100
```

## Gross Profit and Margin

```
Gross Profit = Revenue - Direct Cost
Gross Margin = (Gross Profit / Revenue) × 100
```

## Sales Pipeline

```
Weighted Pipeline Value = Σ (Deal Value × Probability)
```

## Capacity

```
Available Capacity =
  Working Hours
  - Assigned Hours
  - Meetings
  - Support
  - Internal Work
  - Time Off
  - Buffer

Utilisation = Assigned Hours / Available Hours × 100
```

Thresholds:
- Green: below 70%
- Yellow: 70% to 85%
- Red: above 85%

## Financial Warnings

| Condition                           | Trigger     |
|-------------------------------------|-------------|
| Actual cost exceeds budget          | > 10% over  |
| Actual hours exceed estimate        | > 20% over  |
| Project margin below target         | Any amount  |
| Invoice overdue                     | Past due    |
| Unapproved project expenses         | Any pending |
| Change request work before approval | Any         |
| Near completion, payment missing    | > 80% done  |
