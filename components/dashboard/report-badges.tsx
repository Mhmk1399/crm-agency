"use client";

export interface ReportBadge {
  label: string;
  value: string | number;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

interface ReportBadgesProps {
  badges: ReportBadge[];
}

const variantStyles = {
  default: "bg-muted-bg text-foreground border-separator",
  primary: "bg-primary/8 text-primary border-primary/15",
  success: "bg-success/8 text-success border-success/15",
  warning: "bg-warning/8 text-warning border-warning/15",
  destructive: "bg-destructive/8 text-destructive border-destructive/15",
};

export default function ReportBadges({ badges }: ReportBadgesProps) {
  if (badges.length === 0) return null;
  return (
    <div className="flex w-full min-w-0 max-w-full flex-wrap gap-2">
      {badges.map((b) => (
        <div
          key={b.label}
          className={`glass flex min-w-0 max-w-full items-center gap-2.5 rounded-[var(--radius-sm)] border px-4 py-2.5 ${variantStyles[b.variant ?? "default"]}`}
        >
          <span className="min-w-0 truncate text-[12px] font-medium opacity-70">{b.label}</span>
          <span className="shrink-0 text-[16px] font-bold leading-none">{b.value}</span>
        </div>
      ))}
    </div>
  );
}
