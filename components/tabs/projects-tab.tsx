"use client";

import { useMemo, useState } from "react";
import { z } from "zod/v4";
import { useQuery } from "@tanstack/react-query";
import { useCrud } from "@/lib/use-crud";
import { useSession } from "@/lib/use-session";
import CrudTab from "@/components/dashboard/crud-tab";
import ProjectDetail from "@/components/dashboard/project-detail";
import StatusPicker, { type StatusOption } from "@/components/ui/status-picker";
import Badge from "@/components/ui/badge";
import type { ReportBadge } from "@/components/dashboard/report-badges";
import type { FieldConfig } from "@/types/dynamic-form";
import type { ColumnConfig, TableAction } from "@/types/dynamic-table";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  projectCode: z.string().min(2, "Code required"),
  description: z.string().optional(),
  clientId: z.string().optional(),
  proposalId: z.string().optional(),
  status: z.string().min(1, "Status required"),
  riskLevel: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  contractValue: z.number().min(0),
  budgetedCost: z.number().min(0),
  estimatedHours: z.number().min(0),
  expectedProfit: z.number().min(0),
  expectedMarginPercentage: z.number().min(0).max(100),
  progressPercentage: z.number().min(0).max(100),
});

const statusVariant: Record<string, "primary" | "success" | "warning" | "destructive" | "default"> = {
  planned: "default", active: "primary", on_hold: "warning",
  client_review: "warning", completed: "success", cancelled: "destructive",
};
const riskVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  low: "success", medium: "warning", high: "destructive", critical: "destructive",
};

const statusOptions: StatusOption[] = [
  { value: "planned", label: "Planned", variant: "default" },
  { value: "active", label: "Active", variant: "primary" },
  { value: "on_hold", label: "On Hold", variant: "warning" },
  { value: "client_review", label: "Client Review", variant: "warning" },
  { value: "completed", label: "Completed", variant: "success" },
  { value: "cancelled", label: "Cancelled", variant: "destructive" },
];

const fmt = (v: number) => {
  if (v >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B T";
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M T";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K T";
  return v + " T";
};

interface Client { _id: string; name: string; companyName: string; [key: string]: unknown }
interface Proposal { _id: string; title: string; proposalNumber: string; [key: string]: unknown }
interface User { _id: string; name: string; email: string; [key: string]: unknown }

interface Project {
  _id: string; name: string; projectCode: string; description?: string;
  clientId?: string; proposalId?: string; serviceIds?: string[];
  ownerId?: string; projectManagerId?: string;
  status: string; riskLevel: string;
  startDate?: string; deadline?: string; completedAt?: string;
  contractValue: number; budgetedCost: number; estimatedHours: number; actualHours: number;
  expectedProfit: number; actualCost: number; actualProfit: number;
  expectedMarginPercentage: number; actualMarginPercentage: number;
  healthScore: number; progressPercentage: number;
  createdAt: string; updatedAt?: string;
  [key: string]: unknown;
}

const columns: ColumnConfig<Project>[] = [
  { key: "projectCode", label: "Code", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "status", label: "Status", sortable: true,
    render: (v) => <Badge variant={statusVariant[String(v)] ?? "default"}>{String(v).replace(/_/g, " ")}</Badge> },
  { key: "riskLevel", label: "Risk", sortable: true, hideOnMobile: true,
    render: (v) => <Badge variant={riskVariant[String(v)] ?? "default"}>{String(v)}</Badge> },
  { key: "contractValue", label: "Value", sortable: true, align: "right", hideOnMobile: true, render: (v) => fmt(Number(v)) },
  { key: "healthScore", label: "Health", sortable: true, align: "right",
    render: (v) => { const n = Number(v); const c = n >= 85 ? "text-success" : n >= 65 ? "text-warning" : "text-destructive"; return <span className={`font-semibold ${c}`}>{n}%</span>; }},
  { key: "progressPercentage", label: "Progress", sortable: true, align: "right",
    render: (v) => (
      <div className="flex items-center gap-2 justify-end">
        <div className="w-16 h-1.5 rounded-full bg-muted-bg overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Number(v)}%` }} /></div>
        <span className="text-[12px] text-muted">{String(v)}%</span>
      </div>
    )},
  { key: "deadline", label: "Deadline", sortable: true, hideOnMobile: true,
    render: (v) => {
      if (!v) return <span className="text-muted">—</span>;
      const d = new Date(String(v));
      const overdue = d < new Date();
      return <span className={overdue ? "text-destructive font-medium" : ""}>{d.toLocaleDateString()}</span>;
    }},
];

export default function ProjectsTab() {
  const { session, isAdmin } = useSession();
  const crud = useCrud<Project>({ endpoint: "projects", label: "Project" });
  const clientsCrud = useCrud<Client>({ endpoint: "clients", label: "Client" });
  const proposalsCrud = useCrud<Proposal>({ endpoint: "proposals", label: "Proposal" });
  const usersCrud = useCrud<User>({ endpoint: "users", label: "User" });

  const { data: allTasks = [] } = useQuery<{ _id: string; projectId?: string; assigneeIds: string[] }[]>({
    queryKey: ["tasks"],
    queryFn: async () => { const r = await fetch("/api/tasks?limit=1000"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });

  const myProjectIds = useMemo(() => {
    if (isAdmin) return null;
    const ids = new Set<string>();
    for (const t of allTasks) {
      if (t.assigneeIds?.includes(session?.userId ?? "") && t.projectId) ids.add(t.projectId);
    }
    return ids;
  }, [allTasks, session?.userId, isAdmin]);

  const filteredProjects = useMemo(() => {
    if (!myProjectIds) return crud.data;
    return crud.data.filter(p => myProjectIds.has(p._id));
  }, [crud.data, myProjectIds]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusProject, setStatusProject] = useState<Project | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const clientOptions = useMemo(() => clientsCrud.data.map((c) => ({ label: `${c.name} — ${c.companyName}`, value: c._id })), [clientsCrud.data]);
  const proposalOptions = useMemo(() => proposalsCrud.data.map((p) => ({ label: `${p.proposalNumber} — ${p.title}`, value: p._id })), [proposalsCrud.data]);
  const userOptions = useMemo(() => usersCrud.data.map((u) => ({ label: `${u.name} (${u.email})`, value: u._id })), [usersCrud.data]);


  const fields: FieldConfig[] = useMemo(() => [
    { name: "name", label: "Project Name", type: "text" as const, required: true, placeholder: "Project name" },
    { name: "projectCode", label: "Project Code", type: "text" as const, required: true, placeholder: "PRJ-001" },
    { name: "clientId", label: "Client", type: "searchselect" as const, placeholder: "Search clients...", options: clientOptions },
    { name: "proposalId", label: "From Proposal", type: "searchselect" as const, placeholder: "Search proposals...", options: proposalOptions },
    { name: "projectManagerId", label: "Project Manager", type: "searchselect" as const, placeholder: "Search team...", options: userOptions },
    { name: "status", label: "Status", type: "select" as const, required: true, options: statusOptions.map((s) => ({ label: s.label, value: s.value })) },
    { name: "riskLevel", label: "Risk Level", type: "select" as const, options: [
      { label: "Low", value: "low" }, { label: "Medium", value: "medium" },
      { label: "High", value: "high" }, { label: "Critical", value: "critical" },
    ]},
    { name: "startDate", label: "Start Date", type: "date" as const },
    { name: "deadline", label: "Deadline", type: "date" as const },
    { name: "progressPercentage", label: "Progress %", type: "percentage" as const },
    { name: "contractValue", label: "Contract Value", type: "currency" as const, prefix: "T", required: true },
    { name: "budgetedCost", label: "Budgeted Cost", type: "currency" as const, prefix: "T" },
    { name: "estimatedHours", label: "Estimated Hours", type: "number" as const },
    { name: "expectedProfit", label: "Expected Profit", type: "currency" as const, prefix: "T" },
    { name: "expectedMarginPercentage", label: "Expected Margin", type: "percentage" as const },
    { name: "description", label: "Description", type: "textarea" as const, colSpan: 2 as const, placeholder: "Project scope and details..." },
  ], [clientOptions, proposalOptions, userOptions]);

  async function handleStatusChange(newStatus: string) {
    if (!statusProject) return;
    setStatusLoading(true);
    const extra: Record<string, unknown> = { status: newStatus };
    if (newStatus === "completed") extra.completedAt = new Date().toISOString();
    await crud.update(statusProject._id, extra);
    setStatusLoading(false);
    setStatusProject(null);
  }

  const extraActions: TableAction<Project>[] = [
    {
      label: "Open",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
      onClick: (row) => setSelectedProject(row),
    },
    {
      label: "Status",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
      onClick: (row) => setStatusProject(row),
    },
  ];

  const badges: ReportBadge[] = useMemo(() => {
    const d = filteredProjects;
    const byStatus: Record<string, number> = {};
    let totalContract = 0;
    let atRisk = 0;
    let critical = 0;
    for (const p of d) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      if (p.status === "active" || p.status === "on_hold") totalContract += p.contractValue;
      if (p.healthScore < 85 && p.healthScore >= 65) atRisk++;
      if (p.healthScore < 65) critical++;
    }
    return [
      { label: "Total", value: d.length, variant: "default" },
      { label: "Active", value: byStatus["active"] ?? 0, variant: "primary" },
      { label: "Completed", value: byStatus["completed"] ?? 0, variant: "success" },
      { label: "On Hold", value: byStatus["on_hold"] ?? 0, variant: "warning" },
      { label: "At Risk", value: atRisk, variant: atRisk > 0 ? "warning" : "default" },
      { label: "Critical", value: critical, variant: critical > 0 ? "destructive" : "default" },
      { label: "Active Value", value: fmt(totalContract), variant: "primary" },
    ] as ReportBadge[];
  }, [filteredProjects]);

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        users={usersCrud.data}
      />
    );
  }

  return (
    <>
      <CrudTab
        title="Projects"
        description="Manage projects and delivery"
        columns={columns}
        data={filteredProjects}
        loading={crud.loading}
        fields={fields}
        schema={schema}
        reportBadges={badges}
        extraActions={extraActions}
        onCreate={(d) => crud.create({ ...d, status: d.status ?? "planned", riskLevel: d.riskLevel ?? "low" })}
        onUpdate={(id, d) => crud.update(id, d)}
        onDelete={(id) => crud.remove(id)}
        addLabel="+ New Project"
      />

      <StatusPicker
        open={statusProject !== null}
        onClose={() => setStatusProject(null)}
        title={`Update Status — ${statusProject?.name ?? ""}`}
        currentStatus={statusProject?.status ?? ""}
        options={statusOptions}
        onSelect={handleStatusChange}
        isLoading={statusLoading}
      />
    </>
  );
}
