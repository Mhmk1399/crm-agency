interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantColors = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const iconBg = {
  default: "bg-muted-bg",
  primary: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
}: StatCardProps) {
  return (
    <div className="glass rounded-[var(--radius)] p-5 flex items-start gap-4">
      {icon && (
        <div className={`w-11 h-11 rounded-xl ${iconBg[variant]} flex items-center justify-center shrink-0 ${variantColors[variant]}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-muted uppercase tracking-wider">{title}</p>
        <p className={`text-[22px] font-bold mt-0.5 leading-tight ${variantColors[variant]}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[12px] text-muted mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
