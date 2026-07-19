"use client";

import StatCard from "@/components/dashboard/stat-card";
import { useDashboardCounts, useOwnerStats } from "@/lib/use-dashboard-metrics";
import { hasGlobalDashboardAccess } from "@/lib/permissions";
import { useSession } from "@/lib/use-session";

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B T`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M T`;
  }
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K T`;
  return `${value} T`;
}

function Icon({
  name,
}: {
  name:
    | "projects"
    | "pipeline"
    | "revenue"
    | "time"
    | "docs"
    | "team"
    | "tasks"
    | "invoice";
}) {
  const paths = {
    projects: (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    ),
    pipeline: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
    revenue: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    time: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
    docs: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),
    team: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </>
    ),
    tasks: (
      <>
        <path d="M9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    invoice: (
      <>
        <path d="M4 2h16v20l-4-2-4 2-4-2-4 2V2z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
      </>
    ),
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name]}
    </svg>
  );
}

export default function OverviewTab() {
  const { data: stats, isLoading: statsLoading } = useOwnerStats();
  const { data: counts, isLoading: countsLoading } = useDashboardCounts();
  const { role } = useSession();
  const globalDashboard = hasGlobalDashboardAccess(role);

  const overdueTotal =
    (stats?.overdueTasks ?? 0) + (stats?.overdueInvoices ?? 0);
  const projectRiskTotal =
    (stats?.atRiskProjects ?? 0) + (stats?.criticalProjects ?? 0);
  const projectRiskProgress = stats?.activeProjects
    ? Math.round((projectRiskTotal / stats.activeProjects) * 100)
    : 0;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            {globalDashboard
              ? "Live operating snapshot across sales, delivery, finance, and team."
              : "Your tasks, finance, and team snapshot."}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-input-border bg-muted-bg px-3 py-2 text-[12px] text-muted sm:w-fit">
          <span className="h-2 w-2 rounded-full bg-success" />
          Cached dashboard data
        </div>
      </div>

      {globalDashboard ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Projects"
            value={stats?.activeProjects ?? "-"}
            subtitle={`${stats?.atRiskProjects ?? 0} at risk, ${stats?.criticalProjects ?? 0} critical`}
            variant={projectRiskTotal > 0 ? "warning" : "primary"}
            progress={projectRiskProgress}
            meta={`${counts?.documents.projects ?? 0} total projects`}
            loading={statsLoading}
            icon={<Icon name="projects" />}
          />
          <StatCard
            title="Pipeline Value"
            value={stats ? formatCurrency(stats.pipelineValue) : "-"}
            subtitle={
              stats
                ? `${stats.pipelineLeadCount} active leads, ${formatCurrency(stats.weightedPipelineValue)} weighted`
                : ""
            }
            variant="warning"
            loading={statsLoading}
            icon={<Icon name="pipeline" />}
          />
          <StatCard
            title="Monthly Revenue"
            value={stats ? formatCurrency(stats.monthlyRevenue) : "-"}
            subtitle={
              stats
                ? `Outstanding invoices: ${formatCurrency(stats.outstandingInvoices)}`
                : ""
            }
            variant="success"
            loading={statsLoading}
            icon={<Icon name="revenue" />}
          />
          <StatCard
            title="Overdue Items"
            value={overdueTotal}
            subtitle={`${stats?.overdueTasks ?? 0} tasks, ${stats?.overdueInvoices ?? 0} invoices`}
            variant={overdueTotal > 0 ? "destructive" : "success"}
            loading={statsLoading}
            icon={<Icon name="time" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Open Tasks"
            value={counts?.highlights.openTasks ?? "-"}
            subtitle={`${counts?.documents.tasks ?? 0} total tasks`}
            variant="warning"
            loading={countsLoading}
            icon={<Icon name="tasks" />}
          />
          <StatCard
            title="Overdue Tasks"
            value={stats?.overdueTasks ?? "-"}
            subtitle="Tasks that need attention"
            variant={(stats?.overdueTasks ?? 0) > 0 ? "destructive" : "success"}
            loading={statsLoading}
            icon={<Icon name="time" />}
          />
          <StatCard
            title="Monthly Revenue"
            value={stats ? formatCurrency(stats.monthlyRevenue) : "-"}
            subtitle={
              stats
                ? `Outstanding invoices: ${formatCurrency(stats.outstandingInvoices)}`
                : ""
            }
            variant="success"
            loading={statsLoading}
            icon={<Icon name="revenue" />}
          />
          <StatCard
            title="Team"
            value={counts?.highlights.activeUsers ?? "-"}
            subtitle={`${counts?.documents.teamMemberProfiles ?? 0} profiles`}
            variant="primary"
            loading={countsLoading}
            icon={<Icon name="team" />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            title="All Documents"
            value={counts?.totals.documents ?? "-"}
            subtitle="Total records in this workspace"
            variant="primary"
            loading={countsLoading}
            icon={<Icon name="docs" />}
          />
          <StatCard
            title="Open Tasks"
            value={counts?.highlights.openTasks ?? "-"}
            subtitle={`${counts?.documents.tasks ?? 0} total tasks`}
            variant="warning"
            loading={countsLoading}
            icon={<Icon name="tasks" />}
          />
          <StatCard
            title="Invoices"
            value={counts?.documents.invoices ?? "-"}
            subtitle={`${counts?.highlights.overdueInvoices ?? 0} overdue`}
            variant={(counts?.highlights.overdueInvoices ?? 0) > 0 ? "destructive" : "success"}
            loading={countsLoading}
            icon={<Icon name="invoice" />}
          />
          <StatCard
            title="Team Members"
            value={counts?.highlights.activeUsers ?? "-"}
            subtitle={`${counts?.documents.users ?? 0} total users`}
            variant="primary"
            loading={countsLoading}
            icon={<Icon name="team" />}
          />
        </div>

        <div className="glass rounded-[var(--radius)] p-5">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-foreground">
              Workspace Totals
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              Cached counts by operating area.
            </p>
          </div>
          <div className="space-y-3">
            {(globalDashboard
              ? [
                  ["CRM", counts?.totals.crm ?? 0, "Leads, clients, proposals", "bg-primary"],
                  ["Delivery", counts?.totals.delivery ?? 0, "Projects, tasks, milestones", "bg-warning"],
                  ["Finance", counts?.totals.finance ?? 0, "Invoices, payments, expenses", "bg-success"],
                  ["Team", counts?.totals.team ?? 0, "Users, profiles, compensation", "bg-destructive"],
                ]
              : [
                  ["Tasks", counts?.documents.tasks ?? 0, "Your assigned and created work", "bg-warning"],
                  ["Finance", counts?.totals.finance ?? 0, "Your invoices, payments, expenses", "bg-success"],
                  ["Team", counts?.totals.team ?? 0, "Your profile and compensation", "bg-destructive"],
                ]
            ).map(([label, value, description, dot]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-muted-bg px-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <p className="text-[13px] font-semibold text-foreground">
                      {label}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    {description}
                  </p>
                </div>
                <span className="text-[18px] font-bold text-foreground">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
