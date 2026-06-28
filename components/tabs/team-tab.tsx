"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod/v4";
import { useCrud } from "@/lib/use-crud";
import CrudTab from "@/components/dashboard/crud-tab";
import Badge from "@/components/ui/badge";
import StatusPicker, { type StatusOption } from "@/components/ui/status-picker";
import type { ReportBadge } from "@/components/dashboard/report-badges";
import type { FieldConfig } from "@/types/dynamic-form";
import type { ColumnConfig } from "@/types/dynamic-table";

// ── Types ──
interface User { _id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt?: string; createdAt: string; [key: string]: unknown }
interface Profile { _id: string; userId: string; title: string; department: string; skills: string[]; startDate: string; endDate?: string; employmentType: string; weeklyCapacityHours: number; isActive: boolean; [key: string]: unknown }
interface Compensation { _id: string; userId: string; salary: number; employerCosts: number; fullyLoadedMonthlyCost: number; realisticBillableHours: number; internalHourlyCost: number; effectiveFrom: string; isActive: boolean; [key: string]: unknown }
interface Task { _id: string; title: string; status: string; assigneeIds: string[]; estimatedMinutes: number; actualMinutes: number; projectId?: string; [key: string]: unknown }
interface Project { _id: string; name: string; projectCode: string; [key: string]: unknown }

type SubTab = "users" | "profiles" | "workload";

// ── Schemas ──
const userSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.email("Invalid email"),
  password: z.string().min(6, "Min 6 characters").optional(),
  role: z.string().min(1, "Role required"),
});

const profileSchema = z.object({
  userId: z.string().min(1, "User required"),
  title: z.string().min(1, "Title required"),
  department: z.string().min(1, "Department required"),
  skills: z.string().optional(),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().optional(),
  employmentType: z.string().min(1, "Required"),
  weeklyCapacityHours: z.number().min(1),
});

const compensationSchema = z.object({
  userId: z.string().min(1, "User required"),
  salary: z.number().min(0),
  employerCosts: z.number().min(0).optional(),
  softwareAllocation: z.number().min(0).optional(),
  equipmentAllocation: z.number().min(0).optional(),
  officeAllocation: z.number().min(0).optional(),
  managementAllocation: z.number().min(0).optional(),
  otherOverhead: z.number().min(0).optional(),
  fullyLoadedMonthlyCost: z.number().min(0),
  realisticBillableHours: z.number().min(1),
  internalHourlyCost: z.number().min(0),
  effectiveFrom: z.string().min(1),
});

const roleVariant: Record<string, "primary" | "success" | "warning" | "default" | "destructive"> = {
  owner: "primary", admin: "success", project_manager: "warning", developer: "default", designer: "default",
  sales: "default", marketing: "default", finance: "default", client: "destructive",
};

const activeOptions: StatusOption[] = [
  { value: "true", label: "Active", variant: "success" },
  { value: "false", label: "Inactive", variant: "default" },
];

const fmtH = (mins: number) => { const h = Math.floor(mins / 60); const m = mins % 60; return m > 0 ? `${h}h ${m}m` : `${h}h`; };

// ── Sub-tab button ──
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${active ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground hover:bg-muted-bg"}`}>
      {label}
    </button>
  );
}

// ── Donut chart for workload ──
function MiniDonut({ used, total, color }: { used: number; total: number; color: string }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--muted-bg)" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" className="transition-all duration-500" />
    </svg>
  );
}

// ── Main ──
export default function TeamTab() {
  const [subTab, setSubTab] = useState<SubTab>("users");
  const [statusUser, setStatusUser] = useState<User | null>(null);

  const userCrud = useCrud<User>({ endpoint: "users", label: "User" });
  const profileCrud = useCrud<Profile>({ endpoint: "team-member-profiles", label: "Profile" });
  const compCrud = useCrud<Compensation>({ endpoint: "compensation-profiles", label: "Compensation" });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => { const r = await fetch("/api/tasks?limit=1000"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => { const r = await fetch("/api/projects?limit=200"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });

  const userMap = useMemo(() => new Map(userCrud.data.map(u => [u._id, u.name])), [userCrud.data]);
  const userOptions = useMemo(() => userCrud.data.map(u => ({ label: `${u.name} (${u.email})`, value: u._id })), [userCrud.data]);
  const profileMap = useMemo(() => new Map(profileCrud.data.map(p => [p.userId, p])), [profileCrud.data]);
  const projectMap = useMemo(() => new Map(projects.map(p => [p._id, p.name])), [projects]);

  // ── Workload from tasks ──
  const workload = useMemo(() => {
    const map = new Map<string, { estimated: number; actual: number; todo: number; inProgress: number; done: number; blocked: number; projects: Set<string> }>();
    for (const t of tasks) {
      for (const uid of (t.assigneeIds ?? [])) {
        const w = map.get(uid) ?? { estimated: 0, actual: 0, todo: 0, inProgress: 0, done: 0, blocked: 0, projects: new Set() };
        w.estimated += t.estimatedMinutes ?? 0;
        w.actual += t.actualMinutes ?? 0;
        if (t.status === "todo" || t.status === "backlog") w.todo++;
        else if (t.status === "in_progress" || t.status === "review") w.inProgress++;
        else if (t.status === "done") w.done++;
        else if (t.status === "blocked") w.blocked++;
        if (t.projectId) w.projects.add(t.projectId);
        map.set(uid, w);
      }
    }
    return map;
  }, [tasks]);

  // ── User fields ──
  const userFields: FieldConfig[] = [
    { name: "name", label: "Full Name", type: "text", required: true, placeholder: "John Doe" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "john@company.com" },
    { name: "password", label: "Password", type: "password", placeholder: "Min 6 characters" },
    { name: "role", label: "Role", type: "select", required: true, options: [
      { label: "Owner", value: "owner" }, { label: "Admin", value: "admin" },
      { label: "Project Manager", value: "project_manager" }, { label: "Developer", value: "developer" },
      { label: "Designer", value: "designer" }, { label: "Sales", value: "sales" },
      { label: "Marketing", value: "marketing" }, { label: "Finance", value: "finance" },
    ]},
  ];

  const userColumns: ColumnConfig<User>[] = useMemo(() => [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true, hideOnMobile: true },
    { key: "role", label: "Role", sortable: true, render: (v) => <Badge variant={roleVariant[String(v)] ?? "default"}>{String(v).replace(/_/g, " ")}</Badge> },
    { key: "isActive", label: "Status",
      render: (_v, row) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); setStatusUser(row); }} className="cursor-pointer">
          <Badge variant={row.isActive ? "success" : "default"}>{row.isActive ? "Active" : "Inactive"}</Badge>
        </button>
      ),
    },
    { key: "lastLoginAt", label: "Last Login", sortable: true, hideOnMobile: true, render: (v) => v ? new Date(String(v)).toLocaleDateString() : "Never" },
  ], []);

  const userBadges: ReportBadge[] = useMemo(() => {
    const d = userCrud.data;
    const active = d.filter(u => u.isActive).length;
    const byRole: Record<string, number> = {};
    for (const u of d) byRole[u.role] = (byRole[u.role] ?? 0) + 1;
    return [
      { label: "Total", value: d.length, variant: "default" },
      { label: "Active", value: active, variant: "success" },
      { label: "Developers", value: byRole["developer"] ?? 0, variant: "primary" },
      { label: "Designers", value: byRole["designer"] ?? 0, variant: "primary" },
      { label: "Managers", value: byRole["project_manager"] ?? 0, variant: "warning" },
    ] as ReportBadge[];
  }, [userCrud.data]);

  // ── Profile fields ──
  const profileFields: FieldConfig[] = useMemo(() => [
    { name: "userId", label: "User", type: "searchselect" as const, required: true, options: userOptions, placeholder: "Select user..." },
    { name: "title", label: "Job Title", type: "text" as const, required: true, placeholder: "Senior Developer" },
    { name: "department", label: "Department", type: "select" as const, required: true, options: [
      { label: "Engineering", value: "engineering" }, { label: "Design", value: "design" },
      { label: "Product", value: "product" }, { label: "Sales", value: "sales" },
      { label: "Marketing", value: "marketing" }, { label: "Operations", value: "operations" },
      { label: "Finance", value: "finance" }, { label: "HR", value: "hr" },
    ]},
    { name: "employmentType", label: "Employment", type: "select" as const, required: true, options: [
      { label: "Full-time", value: "full_time" }, { label: "Part-time", value: "part_time" }, { label: "Contractor", value: "contractor" },
    ]},
    { name: "weeklyCapacityHours", label: "Weekly Capacity (hours)", type: "number" as const, required: true },
    { name: "startDate", label: "Start Date", type: "date" as const, required: true },
    { name: "endDate", label: "End Date", type: "date" as const },
    { name: "skills", label: "Skills", type: "text" as const, placeholder: "React, Node.js, Figma", description: "Comma separated" },
  ], [userOptions]);

  const profileColumns: ColumnConfig<Profile>[] = useMemo(() => [
    { key: "userId", label: "User", sortable: true, render: (v) => userMap.get(String(v)) ?? "—" },
    { key: "title", label: "Title", sortable: true },
    { key: "department", label: "Department", sortable: true, hideOnMobile: true, render: (v) => <span className="capitalize">{String(v)}</span> },
    { key: "employmentType", label: "Type", hideOnMobile: true, render: (v) => <span className="capitalize">{String(v).replace(/_/g, " ")}</span> },
    { key: "weeklyCapacityHours", label: "Hrs/Week", sortable: true, align: "right", render: (v) => `${v}h` },
    { key: "isActive", label: "Status", render: (v) => <Badge variant={v ? "success" : "default"}>{v ? "Active" : "Inactive"}</Badge> },
  ], [userMap]);

  // ── Compensation fields ──
  const compFields: FieldConfig[] = useMemo(() => [
    { name: "userId", label: "User", type: "searchselect" as const, required: true, options: userOptions, placeholder: "Select user..." },
    { name: "salary", label: "Monthly Salary", type: "currency" as const, required: true, prefix: "T" },
    { name: "employerCosts", label: "Employer Costs", type: "currency" as const, prefix: "T", description: "Insurance, tax, etc." },
    { name: "softwareAllocation", label: "Software Cost", type: "currency" as const, prefix: "T" },
    { name: "equipmentAllocation", label: "Equipment Cost", type: "currency" as const, prefix: "T" },
    { name: "officeAllocation", label: "Office Cost", type: "currency" as const, prefix: "T" },
    { name: "managementAllocation", label: "Management Overhead", type: "currency" as const, prefix: "T" },
    { name: "otherOverhead", label: "Other Overhead", type: "currency" as const, prefix: "T" },
    { name: "fullyLoadedMonthlyCost", label: "Total Monthly Cost", type: "currency" as const, prefix: "T", required: true, description: "Sum of all above" },
    { name: "realisticBillableHours", label: "Billable Hours/Month", type: "number" as const, required: true },
    { name: "internalHourlyCost", label: "Internal Hourly Cost", type: "currency" as const, prefix: "T", required: true, description: "Total Cost ÷ Billable Hours" },
    { name: "effectiveFrom", label: "Effective From", type: "date" as const, required: true },
  ], [userOptions]);

  const compColumns: ColumnConfig<Compensation>[] = useMemo(() => [
    { key: "userId", label: "User", sortable: true, render: (v) => userMap.get(String(v)) ?? "—" },
    { key: "salary", label: "Salary", sortable: true, align: "right", render: (v) => `${Number(v).toLocaleString()} T` },
    { key: "fullyLoadedMonthlyCost", label: "Total Cost", sortable: true, align: "right", render: (v) => `${Number(v).toLocaleString()} T` },
    { key: "internalHourlyCost", label: "Hourly Cost", sortable: true, align: "right", render: (v) => `${Number(v).toLocaleString()} T` },
    { key: "realisticBillableHours", label: "Billable Hrs", align: "right", render: (v) => `${v}h` },
    { key: "isActive", label: "Status", render: (v) => <Badge variant={v ? "success" : "default"}>{v ? "Active" : "Ended"}</Badge> },
  ], [userMap]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="text-[14px] text-muted mt-1">Manage members, profiles, compensation, and workload</p>
      </div>

      <div className="flex items-center gap-1 bg-muted-bg rounded-lg p-1 w-fit">
        <TabBtn label="Users" active={subTab === "users"} onClick={() => setSubTab("users")} />
        <TabBtn label="Profiles & Compensation" active={subTab === "profiles"} onClick={() => setSubTab("profiles")} />
        <TabBtn label="Workload" active={subTab === "workload"} onClick={() => setSubTab("workload")} />
      </div>

      {/* ═══ USERS ═══ */}
      {subTab === "users" && (
        <>
          <CrudTab
            title="Team Members"
            description="Add and manage users"
            columns={userColumns}
            data={userCrud.data}
            loading={userCrud.loading}
            fields={userFields}
            schema={userSchema}
            reportBadges={userBadges}
            onCreate={async (d) => {
              const res = await fetch("/api/auth/register-member", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(d),
              });
              const json = await res.json();
              if (!json.success) throw new Error(json.error?.message ?? "Failed");
              return json.data;
            }}
            onUpdate={(id, d) => {
              const { password, ...rest } = d;
              return userCrud.update(id, password ? { ...rest, password } : rest);
            }}
            onDelete={(id) => userCrud.remove(id)}
            addLabel="+ Add Member"
          />
          <StatusPicker
            open={statusUser !== null}
            onClose={() => setStatusUser(null)}
            title={`Update Status — ${statusUser?.name ?? ""}`}
            currentStatus={statusUser?.isActive ? "true" : "false"}
            options={activeOptions}
            onSelect={async (v) => {
              if (!statusUser) return;
              await userCrud.update(statusUser._id, { isActive: v === "true" });
              setStatusUser(null);
            }}
            isLoading={false}
          />
        </>
      )}

      {/* ═══ PROFILES & COMPENSATION ═══ */}
      {subTab === "profiles" && (
        <div className="space-y-8">
          <CrudTab
            title="Member Profiles"
            description="Job title, department, skills, and capacity"
            columns={profileColumns}
            data={profileCrud.data}
            loading={profileCrud.loading}
            fields={profileFields}
            schema={profileSchema}
            onCreate={(d) => {
              const skills = typeof d.skills === "string" ? d.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
              return profileCrud.create({ ...d, skills, isActive: true });
            }}
            onUpdate={(id, d) => {
              const skills = typeof d.skills === "string" ? d.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : d.skills;
              return profileCrud.update(id, { ...d, skills });
            }}
            onDelete={(id) => profileCrud.remove(id)}
            addLabel="+ Add Profile"
          />

          <CrudTab
            title="Compensation"
            description="Salary, costs, and internal hourly rate"
            columns={compColumns}
            data={compCrud.data}
            loading={compCrud.loading}
            fields={compFields}
            schema={compensationSchema}
            onCreate={(d) => compCrud.create({ ...d, isActive: true })}
            onUpdate={(id, d) => compCrud.update(id, d)}
            onDelete={(id) => compCrud.remove(id)}
            addLabel="+ Add Compensation"
          />
        </div>
      )}

      {/* ═══ WORKLOAD ═══ */}
      {subTab === "workload" && (
        <div className="space-y-6">
          <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-separator">
              <h3 className="text-[14px] font-semibold text-foreground">Team Workload</h3>
              <p className="text-[12px] text-muted mt-0.5">Task hours assigned vs completed per member</p>
            </div>
            <div className="p-5 space-y-4">
              {userCrud.data.filter(u => u.isActive).length === 0 ? (
                <p className="text-[13px] text-muted text-center py-8">No active team members</p>
              ) : (
                userCrud.data.filter(u => u.isActive).map(user => {
                  const w = workload.get(user._id);
                  const profile = profileMap.get(user._id);
                  const weeklyCapacity = (profile?.weeklyCapacityHours ?? 44) * 60;
                  const totalTasks = (w?.todo ?? 0) + (w?.inProgress ?? 0) + (w?.done ?? 0) + (w?.blocked ?? 0);
                  const estimated = w?.estimated ?? 0;
                  const actual = w?.actual ?? 0;
                  const overBudget = actual > estimated && estimated > 0;
                  const utilPct = weeklyCapacity > 0 ? Math.round((estimated / weeklyCapacity) * 100) : 0;

                  return (
                    <div key={user._id} className="flex items-center gap-4 py-3 border-b border-separator last:border-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-[12px] font-bold flex items-center justify-center shrink-0">
                        {user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-medium text-foreground truncate">{user.name}</p>
                          <Badge variant={roleVariant[user.role] ?? "default"}>{user.role.replace(/_/g, " ")}</Badge>
                          {profile && <span className="text-[11px] text-muted">{profile.title}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted">
                          <span>{totalTasks} tasks</span>
                          {w?.inProgress ? <span className="text-primary">{w.inProgress} in progress</span> : null}
                          {w?.blocked ? <span className="text-destructive">{w.blocked} blocked</span> : null}
                          {w?.projects.size ? <span>{w.projects.size} project{w.projects.size > 1 ? "s" : ""}</span> : null}
                        </div>
                      </div>

                      {/* Donut */}
                      <div className="flex items-center gap-3 shrink-0">
                        <MiniDonut
                          used={actual}
                          total={Math.max(estimated, actual)}
                          color={overBudget ? "var(--destructive)" : "var(--primary)"}
                        />
                        <div className="text-right">
                          <p className={`text-[13px] font-bold ${overBudget ? "text-destructive" : "text-foreground"}`}>{fmtH(actual)}</p>
                          <p className="text-[10px] text-muted">of {fmtH(estimated)} est.</p>
                        </div>
                      </div>

                      {/* Utilisation bar */}
                      <div className="w-24 shrink-0 hidden sm:block">
                        <div className="flex items-center justify-between text-[10px] text-muted mb-0.5">
                          <span>Load</span>
                          <span className={utilPct > 100 ? "text-destructive font-medium" : ""}>{utilPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted-bg overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${utilPct > 100 ? "bg-destructive" : utilPct > 80 ? "bg-warning" : "bg-success"}`}
                            style={{ width: `${Math.min(utilPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
