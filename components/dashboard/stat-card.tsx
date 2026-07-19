interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  meta?: string;
  progress?: number;
  loading?: boolean;
}

const variantClasses = {
  default: {
    text: "text-foreground",
    bg: "bg-muted-bg",
    bar: "bg-foreground",
  },
  primary: {
    text: "text-primary",
    bg: "bg-primary/10",
    bar: "bg-primary",
  },
  success: {
    text: "text-success",
    bg: "bg-success/10",
    bar: "bg-success",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning/10",
    bar: "bg-warning",
  },
  destructive: {
    text: "text-destructive",
    bg: "bg-destructive/10",
    bar: "bg-destructive",
  },
} as const;

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  meta,
  progress,
  loading = false,
}: StatCardProps) {
  const styles = variantClasses[variant];
  const boundedProgress =
    typeof progress === "number" ? Math.min(Math.max(progress, 0), 100) : null;

  return (
    <div className="glass group rounded-[var(--radius)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {title}
          </p>
          {loading ? (
            <div className="mt-3 h-7 w-24 animate-pulse rounded-md bg-muted-bg" />
          ) : (
            <p
              className={`mt-2 truncate text-[26px] font-bold leading-none sm:text-[30px] ${styles.text}`}
            >
              {value}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.bg} ${styles.text}`}
          >
            {icon}
          </div>
        )}
      </div>

      {subtitle && !loading && (
        <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-muted">
          {subtitle}
        </p>
      )}

      {boundedProgress !== null && (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted-bg">
            <div
              className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
              style={{ width: `${boundedProgress}%` }}
            />
          </div>
        </div>
      )}

      {(meta || trend) && !loading && (
        <div className="mt-4 flex items-center justify-between gap-3 text-[12px]">
          {meta && <span className="truncate text-muted">{meta}</span>}
          {trend && (
            <span
              className={trend.value >= 0 ? "text-success" : "text-destructive"}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
