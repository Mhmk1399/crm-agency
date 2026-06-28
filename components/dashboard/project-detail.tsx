"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v4";
import type { FieldValues } from "react-hook-form";
import toast from "react-hot-toast";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import DynamicForm from "@/components/ui/dynamic-form";
import type { FieldConfig } from "@/types/dynamic-form";
import TaskDetailPanel from "@/components/dashboard/task-detail";

// ── Types ──
interface Project {
  _id: string; name: string; projectCode: string; description?: string;
  status: string; riskLevel: string; healthScore: number; progressPercentage: number;
  contractValue: number; budgetedCost: number; estimatedHours: number; actualHours: number;
  expectedProfit: number; actualCost: number; actualProfit: number;
  expectedMarginPercentage: number; actualMarginPercentage: number;
  startDate?: string; deadline?: string; completedAt?: string;
  clientId?: string; proposalId?: string;
  createdAt: string;
  [key: string]: unknown;
}
interface Milestone { _id: string; title: string; description?: string; dueDate: string; completedAt?: string; isCompleted: boolean; order: number; invoiceOnCompletion: boolean; invoiceAmount: number; [key: string]: unknown }
interface Expense { _id: string; description: string; category: string; amount: number; date: string; isApproved: boolean; [key: string]: unknown }
interface User { _id: string; name: string; email: string; [key: string]: unknown }
interface TaskItem { _id: string; title: string; description?: string; status: string; priority: string; type: string; estimatedMinutes: number; actualMinutes: number; estimatedCost: number; actualCost: number; isBillable: boolean; billableValue: number; complexityPoints: number; tags: string[]; revisionNumber: number; milestoneId?: string; assigneeIds: string[]; startDate?: string; dueDate?: string; completedAt?: string; blockedReason?: string; reviewerId?: string; projectId?: string; createdAt: string; updatedAt?: string; [key: string]: unknown }

// ── Helpers ──
const fmt = (v: number) => {
  if (v >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B T";
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M T";
  if (v >= 1e3) return new Intl.NumberFormat().format(v) + " T";
  return v + " T";
};
const fmtH = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const statusVariant: Record<string, "default" | "primary" | "success" | "warning" | "destructive"> = {
  planned: "default", active: "primary", on_hold: "warning",
  client_review: "warning", completed: "success", cancelled: "destructive",
};
const taskStatusVariant: Record<string, "default" | "primary" | "success" | "warning" | "destructive"> = {
  backlog: "default", todo: "default", in_progress: "primary", review: "warning", blocked: "destructive", done: "success",
};

// ── Schemas ──
const milestoneSchema = z.object({ title: z.string().min(2), description: z.string().optional(), dueDate: z.string().min(1), invoiceOnCompletion: z.boolean().optional(), invoiceAmount: z.number().min(0).optional() });
const expenseSchema = z.object({ description: z.string().min(2), category: z.string().min(1), amount: z.number().min(1), date: z.string().min(1) });
const taskSchema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  reviewerId: z.string().optional(),
  priority: z.string().min(1, "Priority required"),
  type: z.string().min(1, "Type required"),
  complexityPoints: z.number().min(0).optional(),
  estimatedMinutes: z.number().min(0).optional(),
  isBillable: z.boolean().optional(),
  billableValue: z.number().min(0).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  blockedReason: z.string().optional(),
  tags: z.string().optional(),
});

// ── Sub-entity fetcher ──
function useProjectSub<T>(projectId: string, endpoint: string) {
  return useQuery<T[]>({
    queryKey: [endpoint, projectId],
    queryFn: async () => {
      const res = await fetch(`/api/${endpoint}?limit=500&projectId=${projectId}`);
      const json = await res.json();
      return json.success ? (json.data?.data ?? []) : [];
    },
  });
}

// ── Section wrapper ──
function Section({ title, count, children, action }: { title: string; count?: number; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="glass rounded-[var(--radius)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-separator">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
          {count !== undefined && <span className="text-[11px] text-muted bg-muted-bg rounded-full px-2 py-0.5">{count}</span>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Donut chart for hours ──
function HoursDonut({ estimated, actual }: { estimated: number; actual: number }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const total = Math.max(estimated, actual, 1);
  const estimatedPct = estimated / total;
  const actualPct = actual / total;
  const overBudget = actual > estimated;

  const estimatedDash = estimatedPct * circumference;
  const actualDash = actualPct * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-35 h-35">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted-bg)" strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={overBudget ? "var(--destructive)" : "var(--primary)"} strokeWidth="12"
            strokeDasharray={`${actualDash} ${circumference}`} strokeLinecap="round" className="transition-all duration-700" />
          {!overBudget && (
            <circle cx="70" cy="70" r={r} fill="none" stroke="var(--primary)" strokeWidth="12" opacity="0.2"
              strokeDasharray={`${estimatedDash} ${circumference}`} strokeLinecap="round" />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[20px] font-bold ${overBudget ? "text-destructive" : "text-foreground"}`}>{fmtH(actual)}</span>
          <span className="text-[11px] text-muted">of {fmtH(estimated)}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
          <span className="text-muted">Estimated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${overBudget ? "bg-destructive" : "bg-primary"}`} />
          <span className="text-muted">Actual</span>
        </div>
      </div>
      {overBudget && (
        <p className="text-[11px] text-destructive font-medium">+{fmtH(actual - estimated)} over estimate</p>
      )}
    </div>
  );
}

// ── Milestone timeline with tasks ──
function MilestoneTimeline({ milestones, tasks, onAddTask, onViewTask }: {
  milestones: Milestone[];
  tasks: TaskItem[];
  onAddTask: (milestoneId: string) => void;
  onViewTask: (task: TaskItem) => void;
}) {
  const sorted = [...milestones].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return <p className="text-[13px] text-muted text-center py-6">No milestones yet</p>;

  const tasksByMilestone = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of tasks) {
      if (t.milestoneId) {
        const list = map.get(t.milestoneId) ?? [];
        list.push(t);
        map.set(t.milestoneId, list);
      }
    }
    return map;
  }, [tasks]);

  const completedCount = sorted.filter(m => {
    const mTasks = tasksByMilestone.get(m._id) ?? [];
    return mTasks.length > 0 && mTasks.every(t => t.status === "done");
  }).length;
  const pct = sorted.length > 0 ? Math.round((completedCount / sorted.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted-bg overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[12px] font-semibold text-muted shrink-0">{completedCount}/{sorted.length}</span>
      </div>
      <div className="relative">
        {sorted.map((m, i) => {
          const isLast = i === sorted.length - 1;
          const mTasks = tasksByMilestone.get(m._id) ?? [];
          const doneTasks = mTasks.filter(t => t.status === "done").length;
          const isDone = mTasks.length > 0 && doneTasks === mTasks.length;
          const overdue = !isDone && new Date(m.dueDate) < new Date();

          return (
            <div key={m._id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  isDone
                    ? "bg-success border-success text-white"
                    : overdue
                      ? "border-destructive bg-destructive/10"
                      : "border-muted-bg bg-background"
                }`}>
                  {isDone && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                {!isLast && <div className={`w-0.5 flex-1 min-h-6 ${isDone ? "bg-success/40" : "bg-separator"}`} />}
              </div>
              <div className={`pb-5 flex-1 ${isLast ? "" : ""}`}>
                <p className={`text-[13px] font-medium leading-tight ${isDone ? "text-muted line-through" : "text-foreground"}`}>{m.title}</p>
                {m.description && <p className="text-[11px] text-muted mt-0.5">{m.description}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[11px] ${overdue ? "text-destructive font-medium" : "text-muted"}`}>
                    {new Date(m.dueDate).toLocaleDateString()}
                  </span>
                  {m.invoiceOnCompletion && <Badge variant="primary">{fmt(m.invoiceAmount)}</Badge>}
                  {isDone && m.completedAt && <span className="text-[11px] text-success">Done {new Date(m.completedAt).toLocaleDateString()}</span>}
                  {mTasks.length > 0 && (
                    <span className={`text-[11px] font-medium ${isDone ? "text-success" : "text-muted"}`}>
                      {doneTasks}/{mTasks.length} tasks
                    </span>
                  )}
                </div>
                {/* Task list under milestone */}
                {mTasks.length > 0 && (
                  <div className="mt-2 space-y-1 pl-1">
                    {mTasks.map(t => (
                      <div key={t._id} className="flex items-center gap-2 text-[12px] group/task">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          t.status === "done" ? "bg-success" : t.status === "blocked" ? "bg-destructive" : t.status === "in_progress" ? "bg-primary" : "bg-muted"
                        }`} />
                        <span className={t.status === "done" ? "text-muted line-through" : "text-foreground"}>{t.title}</span>
                        <Badge variant={taskStatusVariant[t.status] ?? "default"}>{t.status.replace(/_/g, " ")}</Badge>
                        <button
                          onClick={() => onViewTask(t)}
                          className="opacity-0 group-hover/task:opacity-100 p-0.5 rounded text-muted hover:text-primary transition-all"
                          title="View details"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => onAddTask(m._id)}
                  className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Task
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Add modal helper ──
function AddModal({ open, onClose, title, fields, schema, onSubmit, defaults }: {
  open: boolean; onClose: () => void; title: string;
  fields: FieldConfig[]; schema: unknown;
  onSubmit: (data: FieldValues) => Promise<void>;
  defaults?: Record<string, unknown>;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <DynamicForm fields={fields} schema={schema} onSubmit={onSubmit} submitLabel="Create" onCancel={onClose} columns={2} defaultValues={defaults} />
    </Modal>
  );
}

// ── Main component ──
export default function ProjectDetail({ project, onBack }: {
  project: Project; onBack: () => void; users?: User[];
}) {
  const qc = useQueryClient();
  const pid = project._id;

  const { data: milestones = [] } = useProjectSub<Milestone>(pid, "project-milestones");
  const { data: expenses = [] } = useProjectSub<Expense>(pid, "project-expenses");
  const { data: tasks = [] } = useProjectSub<TaskItem>(pid, "tasks");
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users?limit=200");
      const json = await res.json();
      return json.success ? (json.data?.data ?? []) : [];
    },
  });

  const [addModal, setAddModal] = useState<{ type: string; milestoneId?: string; defaults?: Record<string, unknown> } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [viewTask, setViewTask] = useState<TaskItem | null>(null);

  const userMap = useMemo(() => new Map(allUsers.map(u => [u._id, u.name])), [allUsers]);

  const userOptions = useMemo(() => allUsers.map(u => ({ label: `${u.name} (${u.email})`, value: u._id })), [allUsers]);


  // Hours calculated from tasks
  const hourStats = useMemo(() => {
    let estimated = 0;
    let actual = 0;
    let totalTasks = 0;
    let doneTasks = 0;
    for (const t of tasks) {
      estimated += t.estimatedMinutes ?? 0;
      actual += t.actualMinutes ?? 0;
      totalTasks++;
      if (t.status === "done") doneTasks++;
    }
    return { estimated, actual, totalTasks, doneTasks };
  }, [tasks]);

  // Finance calculations from tasks + expenses
  const financeCalc = useMemo(() => {
    const labourCost = tasks.reduce((s, t) => s + (t.actualCost ?? 0), 0);
    const estimatedLabour = tasks.reduce((s, t) => s + (t.estimatedCost ?? 0), 0);
    const billableValue = tasks.filter(t => t.isBillable).reduce((s, t) => s + (t.billableValue ?? 0), 0);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const actualCost = labourCost + expenseTotal;
    const profit = project.contractValue - actualCost;
    const margin = project.contractValue > 0 ? (profit / project.contractValue) * 100 : 0;
    return { labourCost, estimatedLabour, billableValue, expenseTotal, actualCost, profit, margin };
  }, [tasks, expenses, project.contractValue]);

  const createMut = useMutation({
    mutationFn: async ({ endpoint, body }: { endpoint: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, projectId: pid }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: (_, vars) => {
      toast.success("Created");
      qc.invalidateQueries({ queryKey: [vars.endpoint, pid] });
      if (vars.endpoint === "tasks") qc.invalidateQueries({ queryKey: ["tasks", pid] });
      setAddModal(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const res = await fetch(`/api/${type}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: (_, vars) => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: [vars.type, pid] }); setDeleteTarget(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const milestoneFields: FieldConfig[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "dueDate", label: "Due Date", type: "date", required: true },
    { name: "description", label: "Description", type: "textarea", colSpan: 2 },
    { name: "invoiceOnCompletion", label: "Invoice on completion", type: "checkbox" },
    { name: "invoiceAmount", label: "Invoice Amount", type: "currency", prefix: "T" },
  ];

  const taskFields: FieldConfig[] = useMemo(() => [
    { name: "title", label: "Task Title", type: "text" as const, required: true, colSpan: 2 as const, placeholder: "What needs to be done?" },
    { name: "reviewerId", label: "Reviewer", type: "searchselect" as const, placeholder: "Search team...", options: userOptions },
    { name: "priority", label: "Priority", type: "select" as const, required: true, options: [
      { label: "Urgent", value: "urgent" }, { label: "High", value: "high" },
      { label: "Medium", value: "medium" }, { label: "Low", value: "low" },
    ]},
    { name: "type", label: "Type", type: "select" as const, required: true, options: [
      { label: "Original Scope", value: "original_scope" }, { label: "Bug", value: "bug" },
      { label: "Client Revision", value: "client_revision" }, { label: "Paid Change Request", value: "paid_change_request" },
      { label: "Internal Rework", value: "internal_rework" }, { label: "Marketing", value: "marketing" },
      { label: "Sales", value: "sales" }, { label: "Administrative", value: "administrative" },
      { label: "Support", value: "support" },
    ]},
    { name: "complexityPoints", label: "Complexity Points", type: "number" as const, min: 0 },
    { name: "estimatedMinutes", label: "Estimated (minutes)", type: "number" as const, min: 0 },
    { name: "isBillable", label: "Billable", type: "checkbox" as const },
    { name: "billableValue", label: "Billable Value", type: "currency" as const, prefix: "T" },
    { name: "startDate", label: "Start Date", type: "date" as const },
    { name: "dueDate", label: "Due Date", type: "date" as const },
    { name: "blockedReason", label: "Blocked Reason", type: "text" as const, placeholder: "If blocked, why?" },
    { name: "tags", label: "Tags", type: "text" as const, placeholder: "Comma separated", description: "Separate with commas" },
    { name: "description", label: "Description", type: "textarea" as const, colSpan: 2 as const, placeholder: "Detailed description..." },
  ], [userOptions]);

  const expenseFields: FieldConfig[] = [
    { name: "description", label: "Description", type: "text", required: true },
    { name: "category", label: "Category", type: "select", required: true, options: [
      { label: "Software", value: "software" }, { label: "Hosting", value: "hosting" },
      { label: "Contractor", value: "contractor" }, { label: "Equipment", value: "equipment" },
      { label: "Travel", value: "travel" }, { label: "Other", value: "other" },
    ]},
    { name: "amount", label: "Amount", type: "currency", prefix: "T", required: true },
    { name: "date", label: "Date", type: "date", required: true },
  ];

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const taskProgress = hourStats.totalTasks > 0 ? Math.round((hourStats.doneTasks / hourStats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <Badge variant={statusVariant[project.status] ?? "default"}>{project.status.replace(/_/g, " ")}</Badge>
            <Badge variant={project.riskLevel === "low" ? "success" : project.riskLevel === "medium" ? "warning" : "destructive"}>{project.riskLevel} risk</Badge>
          </div>
          <p className="text-[14px] text-muted mt-0.5">{project.projectCode}{project.description ? ` — ${project.description}` : ""}</p>
        </div>
      </div>

      {/* Financial overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Contract", value: fmt(project.contractValue), color: "text-foreground" },
          { label: "Budget", value: fmt(project.budgetedCost), color: "text-muted" },
          { label: "Actual Cost", value: fmt(project.actualCost), color: project.actualCost > project.budgetedCost ? "text-destructive" : "text-foreground" },
          { label: "Profit", value: fmt(project.actualProfit), color: project.actualProfit >= 0 ? "text-success" : "text-destructive" },
          { label: "Margin", value: `${project.actualMarginPercentage.toFixed(1)}%`, color: project.actualMarginPercentage >= 40 ? "text-success" : project.actualMarginPercentage >= 20 ? "text-warning" : "text-destructive" },
          { label: "Health", value: `${project.healthScore}%`, color: project.healthScore >= 85 ? "text-success" : project.healthScore >= 65 ? "text-warning" : "text-destructive" },
        ].map(c => (
          <div key={c.label} className="glass rounded-[var(--radius-sm)] p-3 text-center">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{c.label}</p>
            <p className={`text-[18px] font-bold mt-0.5 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Hours pie chart + Progress + Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hours donut */}
        <div className="glass rounded-[var(--radius)] p-5 flex flex-col items-center justify-center">
          <h3 className="text-[14px] font-semibold text-foreground mb-4">Hours</h3>
          <HoursDonut estimated={hourStats.estimated} actual={hourStats.actual} />
        </div>

        {/* Task progress */}
        <div className="glass rounded-[var(--radius)] p-5 space-y-4">
          <h3 className="text-[14px] font-semibold text-foreground">Task Progress</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">Tasks Completed</span>
              <span className="font-semibold text-foreground">{hourStats.doneTasks}/{hourStats.totalTasks}</span>
            </div>
            <div className="h-3 rounded-full bg-muted-bg overflow-hidden">
              <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${taskProgress}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {["backlog", "in_progress", "review", "blocked"].map(s => {
              const count = tasks.filter(t => t.status === s).length;
              if (count === 0) return null;
              return (
                <div key={s} className="flex items-center gap-2">
                  <Badge variant={taskStatusVariant[s] ?? "default"}>{s.replace(/_/g, " ")}</Badge>
                  <span className="text-muted">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-[12px] text-muted pt-1">
            {project.startDate && <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>}
            {project.deadline && <span className={new Date(project.deadline) < new Date() && project.status !== "completed" ? "text-destructive font-medium" : ""}>
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </span>}
          </div>
        </div>

        {/* Project completion */}
        <div className="glass rounded-[var(--radius)] p-5 space-y-4">
          <h3 className="text-[14px] font-semibold text-foreground">Completion</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">Overall</span>
              <span className="font-semibold text-foreground">{project.progressPercentage}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted-bg overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${project.progressPercentage}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">Budget Used</span>
              <span className={`font-semibold ${project.actualCost > project.budgetedCost ? "text-destructive" : "text-foreground"}`}>
                {project.budgetedCost > 0 ? Math.round((project.actualCost / project.budgetedCost) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted-bg overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${project.actualCost > project.budgetedCost ? "bg-destructive" : "bg-warning"}`}
                style={{ width: `${Math.min(100, project.budgetedCost > 0 ? (project.actualCost / project.budgetedCost) * 100 : 0)}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">Expenses</span>
              <span className="font-semibold text-foreground">{fmt(totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones (full width) */}
      <Section title="Milestones" count={milestones.length} action={
        <Button size="sm" onClick={() => setAddModal({ type: "milestone" })}>+ Add</Button>
      }>
        <MilestoneTimeline
          milestones={milestones}
          tasks={tasks}
          onAddTask={(milestoneId) => setAddModal({ type: "task", milestoneId, defaults: { priority: "medium", type: "original_scope" } })}
          onViewTask={(task) => setViewTask(task)}
        />
      </Section>

      {/* Expenses */}
      <Section title="Expenses" count={expenses.length} action={
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-muted">Total: {fmt(totalExpenses)}</span>
          <Button size="sm" onClick={() => setAddModal({ type: "expense" })}>+ Add</Button>
        </div>
      }>
        {expenses.length === 0 ? (
          <p className="text-[13px] text-muted text-center py-6">No expenses recorded</p>
        ) : (
          <div className="space-y-2">
            {expenses.map(e => (
              <div key={e._id} className="flex items-center justify-between py-2 border-b border-separator last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-foreground">{e.description}</p>
                  <p className="text-[11px] text-muted capitalize">{e.category} — {new Date(e.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-foreground">{fmt(e.amount)}</span>
                  <Badge variant={e.isApproved ? "success" : "warning"}>{e.isApproved ? "Approved" : "Pending"}</Badge>
                  <button onClick={() => setDeleteTarget({ type: "project-expenses", id: e._id, name: e.description })}
                    className="p-1 rounded text-muted hover:text-destructive hover:bg-destructive/10 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Finance Breakdown */}
      <Section title="Finance Breakdown" action={
        <Badge variant={financeCalc.profit >= 0 ? "success" : "destructive"}>
          {financeCalc.margin.toFixed(1)}% margin
        </Badge>
      }>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Contract Value", value: fmt(project.contractValue), formula: "Fixed from project setup", color: "text-foreground" },
            { label: "Estimated Labour", value: fmt(financeCalc.estimatedLabour), formula: "Σ task.estimatedCost", color: "text-muted" },
            { label: "Actual Labour Cost", value: fmt(financeCalc.labourCost), formula: "Σ task.actualCost", color: financeCalc.labourCost > financeCalc.estimatedLabour ? "text-destructive" : "text-foreground" },
            { label: "Expenses", value: fmt(financeCalc.expenseTotal), formula: "Σ expenses.amount", color: "text-foreground" },
            { label: "Total Actual Cost", value: fmt(financeCalc.actualCost), formula: "Labour + Expenses", color: financeCalc.actualCost > project.budgetedCost ? "text-destructive" : "text-foreground" },
            { label: "Billable Value", value: fmt(financeCalc.billableValue), formula: "Σ task.billableValue (billable only)", color: "text-primary" },
            { label: "Profit", value: fmt(financeCalc.profit), formula: "Contract − Total Cost", color: financeCalc.profit >= 0 ? "text-success" : "text-destructive" },
            { label: "Margin", value: `${financeCalc.margin.toFixed(1)}%`, formula: "(Profit / Contract) × 100", color: financeCalc.margin >= 40 ? "text-success" : financeCalc.margin >= 20 ? "text-warning" : "text-destructive" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-separator last:border-0">
              <div>
                <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted font-mono">{item.formula}</p>
              </div>
              <span className={`text-[15px] font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Add modals */}
      <AddModal open={addModal?.type === "milestone"} onClose={() => setAddModal(null)} title="Add Milestone" fields={milestoneFields} schema={milestoneSchema}
        onSubmit={async (d) => { await createMut.mutateAsync({ endpoint: "project-milestones", body: { ...d, order: milestones.length } }); }} />
      <AddModal open={addModal?.type === "task"} onClose={() => setAddModal(null)} title="Add Task" fields={taskFields} schema={taskSchema}
        defaults={addModal?.defaults}
        onSubmit={async (d) => {
          const tags = typeof d.tags === "string" ? d.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
          await createMut.mutateAsync({
            endpoint: "tasks",
            body: {
              ...d,
              tags,
              status: "todo",
              projectId: pid,
              milestoneId: addModal?.milestoneId,
            },
          });
        }} />
      <AddModal open={addModal?.type === "expense"} onClose={() => setAddModal(null)} title="Add Expense" fields={expenseFields} schema={expenseSchema}
        onSubmit={async (d) => { await createMut.mutateAsync({ endpoint: "project-expenses", body: d }); }} />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate({ type: deleteTarget.type, id: deleteTarget.id }); }}
        title="Delete"
        message={`Remove "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="destructive"
      />

      {/* Task detail modal */}
      {viewTask && (
        <TaskDetailPanel task={viewTask} onClose={() => setViewTask(null)} userMap={userMap} />
      )}
    </div>
  );
}
