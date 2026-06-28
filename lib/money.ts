export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(amount: number, factor: number): number {
  return Math.round(amount * factor);
}

export function divide(amount: number, divisor: number): number {
  if (divisor === 0) throw new Error("Division by zero");
  return Math.round(amount / divisor);
}

export function percentage(amount: number, pct: number): number {
  return Math.round((amount * pct) / 100);
}

export function grossProfit(revenue: number, directCost: number): number {
  return subtract(revenue, directCost);
}

export function grossMargin(revenue: number, directCost: number): number {
  if (revenue === 0) return 0;
  return (grossProfit(revenue, directCost) / revenue) * 100;
}

export function projectPrice(
  estimatedCost: number,
  riskMultiplier: number,
  targetMarginPct: number
): number {
  if (targetMarginPct >= 100) throw new Error("Target margin must be < 100%");
  return Math.round((estimatedCost * riskMultiplier) / (1 - targetMarginPct / 100));
}

export function taskCost(minutes: number, hourlyCostSnapshot: number): number {
  return Math.round((minutes / 60) * hourlyCostSnapshot);
}

export function internalHourlyCost(
  fullyLoadedMonthlyCost: number,
  realisticBillableHours: number
): number {
  if (realisticBillableHours <= 0) throw new Error("Billable hours must be > 0");
  return Math.round(fullyLoadedMonthlyCost / realisticBillableHours);
}

export function fullyLoadedMonthlyCost(components: {
  salary: number;
  employerCosts: number;
  software: number;
  equipment: number;
  office: number;
  management: number;
  overhead: number;
}): number {
  return Object.values(components).reduce((sum, v) => sum + v, 0);
}

export function weightedPipelineValue(
  deals: { value: number; probability: number }[]
): number {
  return deals.reduce(
    (sum, d) => sum + Math.round(d.value * (d.probability / 100)),
    0
  );
}

export function formatToman(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

export function formatTomanCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B T";
  }
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M T";
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(1).replace(/\.0$/, "") + "K T";
  }
  return amount + " T";
}
