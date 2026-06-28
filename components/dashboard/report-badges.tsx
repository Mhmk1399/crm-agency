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
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <div
          key={b.label}
          className={`glass rounded-[var(--radius-sm)] px-4 py-2.5 border flex items-center gap-2.5 ${variantStyles[b.variant ?? "default"]}`}
        >
          <span className="text-[12px] font-medium opacity-70">{b.label}</span>
          <span className="text-[16px] font-bold leading-none">{b.value}</span>
        </div>
      ))}
    </div>
  );
}
