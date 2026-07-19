"use client";

import { useQuery } from "@tanstack/react-query";
import type React from "react";
import Badge from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";

interface WorkItem {
  _id: string;
  title?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  invoiceNumber?: string;
  currency?: string;
  total?: number;
  outstandingAmount?: number;
  amount?: number;
  method?: string;
  reference?: string;
  paidAt?: string;
  [key: string]: unknown;
}

interface MoneyGroup {
  _id: string;
  total: number;
  count: number;
  pending?: number;
}

interface MyWorkData {
  permissions: {
    tasks: boolean;
    invoices: boolean;
    payments: boolean;
    operationalExpenses: boolean;
    projectExpenses: boolean;
    users: boolean;
    profiles: boolean;
    compensation: boolean;
  };
  summary: {
    openTasks: number;
    overdueTasks: number;
    dueTodayTasks: number;
    reviewTasks: number;
    outstandingInvoices: number;
    overdueInvoices: number;
    paymentsThisMonth: MoneyGroup[];
    operationalExpenseTotal: MoneyGroup[];
    projectExpenseTotal: MoneyGroup[];
    users: number;
    activeUsers: number;
  };
  tasks: {
    priority: WorkItem[];
    overdue: WorkItem[];
  };
  finance: {
    overdueInvoices: WorkItem[];
    recentPayments: WorkItem[];
    paymentsThisMonth: MoneyGroup[];
    operationalExpenseTotal: MoneyGroup[];
    projectExpenseTotal: MoneyGroup[];
  };
  team: {
    profile: {
      title?: string;
      department?: string;
      weeklyCapacityHours?: number;
      employmentType?: string;
      skills?: string[];
    } | null;
    compensation: {
      fullyLoadedMonthlyCost?: number;
      internalHourlyCost?: number;
      realisticBillableHours?: number;
    } | null;
    users: number;
    activeUsers: number;
  };
  generatedAt: string;
}

const priorityVariant: Record<string, "default" | "primary" | "warning" | "destructive"> = {
  low: "default",
  medium: "primary",
  high: "warning",
  urgent: "destructive",
};

export default function MyWorkTab() {
  const { data, isLoading } = useQuery<MyWorkData>({
    queryKey: ["my-work"],
    queryFn: async () => {
      const res = await fetch("/api/my-work");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Request failed");
      return json.data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const financeTotal =
    (data?.summary.paymentsThisMonth ?? []).reduce((sum, item) => sum + item.total, 0) -
    (data?.summary.operationalExpenseTotal ?? []).reduce((sum, item) => sum + item.total, 0) -
    (data?.summary.projectExpenseTotal ?? []).reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">My Work</h1>
          <p className="mt-1 text-[14px] text-muted">
            Your quickest path into tasks, finance, and team context.
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-input-border bg-muted-bg px-3 py-2 text-[12px] text-muted">
          {data?.generatedAt ? `Updated ${new Date(data.generatedAt).toLocaleTimeString()}` : "Live workspace snapshot"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Open Tasks"
          value={data?.summary.openTasks ?? "-"}
          subtitle={`${data?.summary.dueTodayTasks ?? 0} due today`}
          variant="warning"
          loading={isLoading}
          icon={<Icon name="tasks" />}
        />
        <StatCard
          title="Overdue Tasks"
          value={data?.summary.overdueTasks ?? "-"}
          subtitle={`${data?.summary.reviewTasks ?? 0} waiting for review`}
          variant={(data?.summary.overdueTasks ?? 0) > 0 ? "destructive" : "success"}
          loading={isLoading}
          icon={<Icon name="time" />}
        />
        <StatCard
          title="Finance Pulse"
          value={formatMoney(financeTotal)}
          subtitle={`${data?.summary.overdueInvoices ?? 0} overdue invoices`}
          variant={financeTotal >= 0 ? "success" : "destructive"}
          loading={isLoading}
          icon={<Icon name="finance" />}
        />
        <StatCard
          title="Team"
          value={data?.summary.activeUsers ?? "-"}
          subtitle={`${data?.summary.users ?? 0} visible members`}
          variant="primary"
          loading={isLoading}
          icon={<Icon name="team" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Panel title="Task Focus" subtitle="Sorted by urgency and due date">
          {!data?.permissions.tasks ? (
            <EmptyState text="You do not have access to tasks." />
          ) : isLoading ? (
            <ListSkeleton />
          ) : data.tasks.priority.length === 0 ? (
            <EmptyState text="No open tasks right now." />
          ) : (
            <div className="space-y-2">
              {data.tasks.priority.map((task) => (
                <div key={task._id} className="rounded-[var(--radius-sm)] border border-separator bg-background px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-foreground">{task.title}</p>
                      <p className="mt-1 text-[12px] text-muted">
                        {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : "No due date"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      <Badge variant={priorityVariant[String(task.priority)] ?? "default"}>{String(task.priority ?? "normal")}</Badge>
                      <Badge variant={task.status === "blocked" ? "destructive" : "default"}>{String(task.status ?? "open").replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Overdue" subtitle="Things that need attention">
            {!data?.permissions.tasks ? (
              <EmptyState text="Task access is not enabled." />
            ) : isLoading ? (
              <ListSkeleton compact />
            ) : data.tasks.overdue.length === 0 ? (
              <EmptyState text="Nothing overdue. Nice and quiet." />
            ) : (
              <div className="space-y-2">
                {data.tasks.overdue.map((task) => (
                  <MiniRow
                    key={task._id}
                    title={task.title ?? "Untitled task"}
                    meta={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                    tone="destructive"
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Team Profile" subtitle="Your visible team information">
            {isLoading ? (
              <ListSkeleton compact />
            ) : (
              <div className="space-y-3">
                {data?.team.profile ? (
                  <div className="rounded-[var(--radius-sm)] bg-muted-bg p-3">
                    <p className="text-[14px] font-semibold text-foreground">{data.team.profile.title}</p>
                    <p className="mt-1 text-[12px] text-muted capitalize">
                      {data.team.profile.department} · {String(data.team.profile.employmentType ?? "").replace(/_/g, " ")}
                    </p>
                    <p className="mt-2 text-[12px] text-muted">
                      {data.team.profile.weeklyCapacityHours ?? 0}h weekly capacity
                    </p>
                  </div>
                ) : (
                  <EmptyState text="No active profile visible." />
                )}
                {data?.team.compensation && (
                  <div className="grid grid-cols-2 gap-2">
                    <Metric label="Monthly cost" value={formatMoney(data.team.compensation.fullyLoadedMonthlyCost ?? 0)} />
                    <Metric label="Hourly cost" value={formatMoney(data.team.compensation.internalHourlyCost ?? 0)} />
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Finance Snapshot" subtitle="Recent money movement you can access">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FinanceColumn
            allowed={data?.permissions.invoices}
            items={data?.finance.overdueInvoices ?? []}
            loading={isLoading}
            title="Overdue invoices"
            render={(item) => (
              <MiniRow
                title={item.invoiceNumber ?? "Invoice"}
                meta={`${formatMoney(item.outstandingAmount ?? item.total ?? 0, item.currency)} outstanding`}
                tone="destructive"
              />
            )}
          />
          <FinanceColumn
            allowed={data?.permissions.payments}
            items={data?.finance.recentPayments ?? []}
            loading={isLoading}
            title="Recent payments"
            render={(item) => (
              <MiniRow
                title={item.reference || item.method || "Payment"}
                meta={`${formatMoney(item.amount ?? 0, item.currency)} · ${item.paidAt ? new Date(item.paidAt).toLocaleDateString() : ""}`}
                tone="success"
              />
            )}
          />
          <div className="rounded-[var(--radius-sm)] border border-separator bg-background p-3">
            <p className="mb-3 text-[13px] font-semibold text-foreground">This month</p>
            {isLoading ? (
              <ListSkeleton compact />
            ) : (
              <div className="space-y-2">
                <MoneyGroups label="Payments" groups={data?.finance.paymentsThisMonth ?? []} />
                <MoneyGroups label="Operational costs" groups={data?.finance.operationalExpenseTotal ?? []} />
                <MoneyGroups label="Project costs" groups={data?.finance.projectExpenseTotal ?? []} />
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius)] border border-separator bg-card">
      <div className="border-b border-separator px-5 py-4">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-[12px] text-muted">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function FinanceColumn({
  allowed,
  items,
  loading,
  render,
  title,
}: {
  allowed?: boolean;
  items: WorkItem[];
  loading: boolean;
  render: (item: WorkItem) => React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-separator bg-background p-3">
      <p className="mb-3 text-[13px] font-semibold text-foreground">{title}</p>
      {!allowed ? (
        <EmptyState text="No access." />
      ) : loading ? (
        <ListSkeleton compact />
      ) : items.length === 0 ? (
        <EmptyState text="Nothing to show." />
      ) : (
        <div className="space-y-2">{items.map((item) => render(item))}</div>
      )}
    </div>
  );
}

function MiniRow({ title, meta, tone = "default" }: { title: string; meta: string; tone?: "default" | "success" | "destructive" }) {
  const dot = tone === "success" ? "bg-success" : tone === "destructive" ? "bg-destructive" : "bg-primary";
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[var(--radius-sm)] bg-muted-bg px-3 py-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">{title}</p>
        <p className="truncate text-[11px] text-muted">{meta}</p>
      </div>
    </div>
  );
}

function MoneyGroups({ label, groups }: { label: string; groups: MoneyGroup[] }) {
  if (groups.length === 0) return <MiniRow title={label} meta="No records" />;
  return (
    <>
      {groups.map((group) => (
        <MiniRow
          key={`${label}-${group._id}`}
          title={label}
          meta={`${formatMoney(group.total, group._id)} · ${group.count} record${group.count === 1 ? "" : "s"}`}
          tone={label === "Payments" ? "success" : "default"}
        />
      ))}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-muted-bg p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-[14px] font-bold text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-dashed border-separator px-3 py-5 text-center text-[13px] text-muted">
      {text}
    </div>
  );
}

function ListSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: compact ? 2 : 4 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-[var(--radius-sm)] bg-muted-bg" />
      ))}
    </div>
  );
}

function Icon({ name }: { name: "tasks" | "time" | "finance" | "team" }) {
  const paths = {
    tasks: (
      <>
        <path d="M9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    time: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
    finance: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    team: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </>
    ),
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      {paths[name]}
    </svg>
  );
}

function formatMoney(value: number, currency = "IRR") {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B ${currency}`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M ${currency}`;
  if (value >= 1_000) return `${new Intl.NumberFormat().format(value)} ${currency}`;
  return `${value} ${currency}`;
}
