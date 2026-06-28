const variantClasses = {
  default: "bg-muted-bg text-foreground",
  primary: "bg-primary/12 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  destructive: "bg-destructive/12 text-destructive",
} as const;

type BadgeVariant = keyof typeof variantClasses;

export default function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
