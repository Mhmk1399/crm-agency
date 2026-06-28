"use client";

import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/dashboard/stat-card";

function formatCurrency(v: number) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B T";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M T";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "K T";
  return v + " T";
}

interface Stats { activeProjects: number; atRiskProjects: number; criticalProjects: number; pipelineLeadCount: number; pipelineValue: number; weightedPipelineValue: number; monthlyRevenue: number; outstandingInvoices: number; overdueTasks: number; overdueInvoices: number }

export default function OverviewTab() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["dashboard", "owner"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/owner");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-[14px] text-muted mt-1">Business overview at a glance</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Projects" value={stats?.activeProjects ?? "—"} subtitle={`${stats?.atRiskProjects ?? 0} at risk, ${stats?.criticalProjects ?? 0} critical`} variant="primary"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>} />
        <StatCard title="Pipeline Value" value={stats ? formatCurrency(stats.pipelineValue) : "—"} subtitle={stats ? `${stats.pipelineLeadCount} leads` : ""} variant="warning"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>} />
        <StatCard title="Monthly Revenue" value={stats ? formatCurrency(stats.monthlyRevenue) : "—"} subtitle={stats ? `Outstanding: ${formatCurrency(stats.outstandingInvoices)}` : ""} variant="success"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} />
        <StatCard title="Overdue Items" value={(stats?.overdueTasks ?? 0) + (stats?.overdueInvoices ?? 0)} subtitle={`${stats?.overdueTasks ?? 0} tasks, ${stats?.overdueInvoices ?? 0} invoices`}
          variant={(stats?.overdueTasks ?? 0) + (stats?.overdueInvoices ?? 0) > 0 ? "destructive" : "success"}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Weighted Pipeline" value={stats ? formatCurrency(stats.weightedPipelineValue) : "—"} variant="warning"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>} />
        <StatCard title="Overdue Invoices" value={stats?.overdueInvoices ?? 0} variant={stats?.overdueInvoices ? "destructive" : "success"}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>} />
      </div>
    </div>
  );
}
