"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  DndContext, PointerSensor, useSensor, useSensors, useDroppable,
  type DragEndEvent, type DragStartEvent, type DragOverEvent, DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { z } from "zod/v4";
import type { FieldValues } from "react-hook-form";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import TaskDetailPanel from "@/components/dashboard/task-detail";
import ReportBadges, { type ReportBadge } from "@/components/dashboard/report-badges";
import DynamicForm from "@/components/ui/dynamic-form";
import StatusPicker, { type StatusOption } from "@/components/ui/status-picker";
import { useSession } from "@/lib/use-session";
import type { FieldConfig } from "@/types/dynamic-form";

const taskStatusOptions: StatusOption[] = [
  { value: "backlog", label: "Backlog", variant: "default" },
  { value: "todo", label: "To Do", variant: "primary" },
  { value: "in_progress", label: "In Progress", variant: "warning" },
  { value: "review", label: "Review", variant: "primary" },
  { value: "blocked", label: "Blocked", variant: "destructive" },
  { value: "done", label: "Done", variant: "success" },
];

// --- Task type ---
interface Task {
  _id: string; title: string; description?: string; status: string;
  priority: string; type: string; assigneeIds: string[];
  projectId?: string; milestoneId?: string; reviewerId?: string;
  complexityPoints: number; estimatedMinutes: number; actualMinutes: number;
  estimatedCost: number; actualCost: number;
  isBillable: boolean; billableValue: number;
  startDate?: string; dueDate?: string; completedAt?: string;
  tags: string[]; revisionNumber: number; order: number;
  blockedReason?: string;
  createdAt: string; updatedAt?: string;
  [key: string]: unknown;
}

interface Project { _id: string; name: string; projectCode: string; [key: string]: unknown }
interface User { _id: string; name: string; email: string; [key: string]: unknown }

type ColumnDef = { id: string; title: string; color: string };
type Column = ColumnDef & { tasks: Task[] };

const COLUMNS: ColumnDef[] = [
  { id: "backlog", title: "Backlog", color: "var(--muted)" },
  { id: "todo", title: "To Do", color: "var(--primary)" },
  { id: "in_progress", title: "In Progress", color: "var(--warning)" },
  { id: "review", title: "Review", color: "#af52de" },
  { id: "blocked", title: "Blocked", color: "var(--destructive)" },
  { id: "done", title: "Done", color: "var(--success)" },
];

const priorityVariant: Record<string, "destructive" | "warning" | "primary" | "default"> = {
  urgent: "destructive", high: "warning", medium: "primary", low: "default",
};

// --- Schema (all model fields) ---
const taskSchema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  projectId: z.string().optional(),
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

// --- Assignee avatars ---
function AssigneeAvatars({ ids, userMap }: { ids: string[]; userMap: Map<string, string> }) {
  if (ids.length === 0) return null;
  const colors = ["bg-primary", "bg-success", "bg-warning", "bg-destructive", "bg-[#af52de]"];
  return (
    <div className="flex -space-x-1.5">
      {ids.slice(0, 3).map((id, i) => {
        const name = userMap.get(id) ?? "?";
        const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={id} title={name} className={`w-6 h-6 rounded-full ${colors[i % colors.length]} text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--background)]`}>
            {initials}
          </div>
        );
      })}
      {ids.length > 3 && (
        <div className="w-6 h-6 rounded-full bg-muted-bg text-muted text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--background)]">
          +{ids.length - 3}
        </div>
      )}
    </div>
  );
}

// --- Task card ---
interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
  userMap?: Map<string, string>;
  userOptions?: { label: string; value: string }[];
  projectMap?: Map<string, string>;
  milestoneMap?: Map<string, string>;
  onAssign?: (taskId: string, userIds: string[]) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task) => void;
}

function TaskCard({ task, isDragging, onClick, userMap, userOptions, projectMap, milestoneMap, onAssign, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [showAssign, setShowAssign] = useState(false);
  const assignRef = useRef<HTMLDivElement>(null);
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const hasAssignees = task.assigneeIds && task.assigneeIds.length > 0;

  useEffect(() => {
    if (!showAssign) return;
    function close(e: MouseEvent) { if (assignRef.current && !assignRef.current.contains(e.target as Node)) setShowAssign(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showAssign]);

  return (
    <div
      onClick={onClick}
      className={`relative bg-[var(--background)] rounded-[var(--radius-sm)] p-3 space-y-2 border border-separator transition-all group ${
        isDragging ? "shadow-xl ring-2 ring-primary/30 opacity-90 scale-[1.02]" : "hover:shadow-md hover:border-primary/20 cursor-pointer"
      }`}
    >
      {/* Top-right action icons — visible on hover */}
      {(onEdit || onDelete || onStatusChange) && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onStatusChange && (
            <button onClick={(e) => { e.stopPropagation(); onStatusChange(task); }} title="Change Status"
              className="p-1 rounded-md text-muted hover:text-warning hover:bg-warning/10 transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} title="Edit"
              className="p-1 rounded-md text-muted hover:text-primary hover:bg-primary/10 transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(task); }} title="Delete"
              className="p-1 rounded-md text-muted hover:text-destructive hover:bg-destructive/10 transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}

      <p className="text-[13px] font-medium text-foreground leading-snug pr-12">{task.title}</p>
      {(projectMap?.get(task.projectId ?? "") || milestoneMap?.get(task.milestoneId ?? "")) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {projectMap?.get(task.projectId ?? "") && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
              {projectMap.get(task.projectId!)}
            </span>
          )}
          {milestoneMap?.get(task.milestoneId ?? "") && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/10 rounded-full px-1.5 py-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
              {milestoneMap.get(task.milestoneId!)}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant={priorityVariant[task.priority] ?? "default"}>{task.priority}</Badge>
        <span className="text-[11px] text-muted capitalize">{task.type.replace(/_/g, " ")}</span>
      </div>
      {task.dueDate && (
        <p className={`text-[11px] ${overdue ? "text-destructive font-medium" : "text-muted"}`}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
      {task.estimatedMinutes > 0 && (
        <p className="text-[11px] text-muted">
          {Math.floor(task.estimatedMinutes / 60)}h {task.estimatedMinutes % 60}m est.
        </p>
      )}
      {/* Bottom row: assignees + assign button */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {hasAssignees && userMap ? (
            <AssigneeAvatars ids={task.assigneeIds} userMap={userMap} />
          ) : (
            <span className="text-[10px] text-muted/60 italic">Unassigned</span>
          )}
        </div>
        {onAssign && userOptions && (
          <div className="relative" ref={assignRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAssign(!showAssign); }}
              title="Assign"
              className={`p-1 rounded-md transition-all ${hasAssignees ? "text-primary hover:bg-primary/10" : "text-muted hover:text-primary hover:bg-primary/10"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </button>
            {showAssign && (
              <div className="absolute right-0 bottom-8 z-50 w-56 bg-[var(--background)] rounded-[var(--radius-sm)] shadow-2xl border border-input-border p-1.5 ring-1 ring-black/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1.5">Assign to</p>
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {userOptions.map((u) => {
                    const isAssigned = task.assigneeIds?.includes(u.value);
                    return (
                      <button
                        key={u.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = isAssigned
                            ? task.assigneeIds.filter((id: string) => id !== u.value)
                            : [...new Set([...(task.assigneeIds ?? []), u.value])];
                          onAssign(task._id, next);
                          setShowAssign(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-[13px] flex items-center gap-2.5 transition-all ${
                          isAssigned ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted-bg"
                        }`}
                      >
                        {isAssigned ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded border border-input-border" />
                        )}
                        <span className="truncate">{u.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sortable wrapper ---
function SortableTaskCard({ task, onClickTask, userMap, userOptions, projectMap, milestoneMap, onAssign, onEdit, onDelete, onStatusChange }: {
  task: Task; onClickTask: (t: Task) => void;
  userMap: Map<string, string>; userOptions: { label: string; value: string }[];
  projectMap: Map<string, string>; milestoneMap: Map<string, string>;
  onAssign: (taskId: string, userIds: string[]) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={() => onClickTask(task)} userMap={userMap} userOptions={userOptions} projectMap={projectMap} milestoneMap={milestoneMap} onAssign={onAssign} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
    </div>
  );
}

// --- Droppable column with pagination ---
const COLUMN_PAGE_SIZE = 8;

function KanbanColumn({ column, onAddTask, onDoubleClick, onClickTask, userMap, userOptions, projectMap, milestoneMap, onAssign, onEdit, onDelete, onStatusChange }: {
  column: Column; onAddTask: (status: string) => void;
  onDoubleClick: (colId: string) => void; onClickTask: (t: Task) => void;
  userMap: Map<string, string>; userOptions: { label: string; value: string }[];
  projectMap: Map<string, string>; milestoneMap: Map<string, string>;
  onAssign: (taskId: string, userIds: string[]) => void;
  onStatusChange: (task: Task) => void;
  onEdit: (task: Task) => void; onDelete: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [visibleCount, setVisibleCount] = useState(COLUMN_PAGE_SIZE);

  const visibleTasks = column.tasks.slice(0, visibleCount);
  const hasMore = column.tasks.length > visibleCount;
  const remaining = column.tasks.length - visibleCount;

  return (
    <div className="flex flex-col w-72 shrink-0" onDoubleClick={() => onDoubleClick(column.id)}>
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="text-[13px] font-semibold text-foreground">{column.title}</h3>
          <span className="text-[11px] text-muted bg-muted-bg rounded-full px-2 py-0.5">{column.tasks.length}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onAddTask(column.id); }} className="text-muted hover:text-primary transition-colors p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 glass rounded-[var(--radius)] p-2 space-y-2 min-h-[200px] transition-all duration-200 ${
          isOver ? "ring-2 ring-primary/40 bg-primary/5" : ""
        }`}
      >
        <SortableContext items={visibleTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {visibleTasks.map(task => <SortableTaskCard key={task._id} task={task} onClickTask={onClickTask} userMap={userMap} userOptions={userOptions} projectMap={projectMap} milestoneMap={milestoneMap} onAssign={onAssign} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />)}
        </SortableContext>
        {column.tasks.length === 0 && (
          <div className={`flex items-center justify-center h-24 text-[12px] rounded-lg border-2 border-dashed transition-colors ${
            isOver ? "border-primary/40 text-primary" : "border-separator text-muted"
          }`}>
            {isOver ? "Drop here" : "No tasks"}
          </div>
        )}
        {hasMore && (
          <button
            onClick={(e) => { e.stopPropagation(); setVisibleCount((c) => c + COLUMN_PAGE_SIZE); }}
            className="w-full py-2 text-[12px] font-medium text-primary hover:bg-primary/8 rounded-lg transition-all"
          >
            Show {Math.min(remaining, COLUMN_PAGE_SIZE)} more ({remaining} left)
          </button>
        )}
        {visibleCount > COLUMN_PAGE_SIZE && column.tasks.length > COLUMN_PAGE_SIZE && (
          <button
            onClick={(e) => { e.stopPropagation(); setVisibleCount(COLUMN_PAGE_SIZE); }}
            className="w-full py-1.5 text-[11px] font-medium text-muted hover:text-foreground hover:bg-muted-bg rounded-lg transition-all"
          >
            Collapse
          </button>
        )}
      </div>
    </div>
  );
}

// --- Fullscreen column view ---
function FullscreenColumn({ column, onClose, onClickTask }: { column: Column; onClose: () => void; onClickTask: (t: Task) => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--background)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
          <h2 className="text-xl font-bold text-foreground">{column.title}</h2>
          <span className="text-[13px] text-muted bg-muted-bg rounded-full px-3 py-1">{column.tasks.length} tasks</span>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-muted-bg transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-7xl mx-auto">
          {column.tasks.map(task => (
            <TaskCard key={task._id} task={task} onClick={() => onClickTask(task)} />
          ))}
          {column.tasks.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-20 text-muted">No tasks in this column</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main component ---
export default function TasksTab() {
  const qc = useQueryClient();
  const { session, isAdmin } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState("backlog");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [statusTask, setStatusTask] = useState<Task | null>(null);
  const [fullscreenCol, setFullscreenCol] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: fetchedTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks?limit=200");
      const json = await res.json();
      return json.success ? (json.data.data ?? []) : [];
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => { const r = await fetch("/api/projects?limit=100"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => { const r = await fetch("/api/users?limit=100"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });

  const allTasks = localTasks ?? fetchedTasks;
  const tasks = isAdmin ? allTasks : allTasks.filter(t => t.assigneeIds?.includes(session?.userId ?? ""));

  const { data: milestones = [] } = useQuery<{ _id: string; title: string; projectId: string }[]>({
    queryKey: ["project-milestones-all"],
    queryFn: async () => { const r = await fetch("/api/project-milestones?limit=500"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });

  const projectOptions = useMemo(() => projects.map((p) => ({ label: `${p.projectCode} — ${p.name}`, value: p._id })), [projects]);
  const userOptions = useMemo(() => users.map((u) => ({ label: `${u.name} (${u.email})`, value: u._id })), [users]);
  const userMap = useMemo(() => new Map(users.map((u) => [u._id, u.name])), [users]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p._id, p.name])), [projects]);
  const milestoneMap = useMemo(() => new Map(milestones.map((m) => [m._id, m.title])), [milestones]);

  const taskFields: FieldConfig[] = useMemo(() => [
    { name: "title", label: "Task Title", type: "text" as const, required: true, colSpan: 2 as const, placeholder: "What needs to be done?" },
    { name: "projectId", label: "Project", type: "searchselect" as const, placeholder: "Search projects...", options: projectOptions },
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
  ], [projectOptions, userOptions]);

  const columns: Column[] = useMemo(() =>
    COLUMNS.map(col => ({
      ...col,
      tasks: tasks.filter(t => t.status === col.id).sort((a, b) => a.order - b.order),
    })),
  [tasks]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Update failed");
      return json.data;
    },
    onSuccess: () => { setLocalTasks(null); qc.invalidateQueries({ queryKey: ["tasks"] }); },
    onError: (e: Error) => { toast.error(e.message); setLocalTasks(null); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t._id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    let targetStatus: string | null = null;

    const isColumn = COLUMNS.some(c => c.id === over.id);
    if (isColumn) {
      targetStatus = over.id as string;
    } else {
      const overTask = tasks.find(t => t._id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    if (!targetStatus) return;
    const currentTask = tasks.find(t => t._id === taskId);
    if (!currentTask || currentTask.status === targetStatus) return;

    setLocalTasks(prev => (prev ?? tasks).map(t => t._id === taskId ? { ...t, status: targetStatus } : t));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) { setLocalTasks(null); return; }

    const taskId = active.id as string;
    const currentTask = (localTasks ?? tasks).find(t => t._id === taskId);
    const originalTask = fetchedTasks.find(t => t._id === taskId);
    if (!currentTask || !originalTask) { setLocalTasks(null); return; }

    if (currentTask.status !== originalTask.status) {
      updateMutation.mutate({ id: taskId, body: { status: currentTask.status } });
    } else {
      setLocalTasks(null);
    }
  }

  const handleCreateTask = useCallback(async (data: FieldValues) => {
    try {
      const tags = typeof data.tags === "string" ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tags, status: newTaskStatus, order: tasks.filter(t => t.status === newTaskStatus).length }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error?.message ?? "Failed"); return; }
      toast.success("Task created");
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch { toast.error("Network error"); }
  }, [newTaskStatus, tasks, qc]);

  const fullscreenColumn = fullscreenCol ? columns.find(c => c.id === fullscreenCol) ?? null : null;

  const badges: ReportBadge[] = useMemo(() => {
    const total = tasks.length;
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalEstMin = 0;
    let totalActMin = 0;
    let overdue = 0;
    const now = new Date();
    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
      totalEstMin += t.estimatedMinutes ?? 0;
      totalActMin += t.actualMinutes ?? 0;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== "done") overdue++;
    }
    const fmtH = (m: number) => m >= 60 ? `${Math.round(m / 60)}h` : `${m}m`;
    return [
      { label: "Total", value: total, variant: "default" },
      { label: "In Progress", value: byStatus["in_progress"] ?? 0, variant: "primary" },
      { label: "Review", value: byStatus["review"] ?? 0, variant: "warning" },
      { label: "Blocked", value: byStatus["blocked"] ?? 0, variant: (byStatus["blocked"] ?? 0) > 0 ? "destructive" : "default" },
      { label: "Done", value: byStatus["done"] ?? 0, variant: "success" },
      { label: "Urgent", value: byPriority["urgent"] ?? 0, variant: (byPriority["urgent"] ?? 0) > 0 ? "destructive" : "default" },
      { label: "Overdue", value: overdue, variant: overdue > 0 ? "destructive" : "default" },
      { label: "Est.", value: fmtH(totalEstMin), variant: "default" },
      { label: "Actual", value: fmtH(totalActMin), variant: "default" },
    ] as ReportBadge[];
  }, [tasks]);

  const handleAssign = useCallback((taskId: string, userIds: string[]) => {
    updateMutation.mutate({ id: taskId, body: { assigneeIds: userIds } });
  }, [updateMutation]);

  const handleEditSubmit = useCallback(async (data: FieldValues) => {
    if (!editingTask) return;
    const tags = typeof data.tags === "string" ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : data.tags;
    await updateMutation.mutateAsync({ id: editingTask._id, body: { ...data, tags } });
    setEditingTask(null);
  }, [editingTask, updateMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/tasks/${deleteTarget._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) { toast.error(json.error?.message ?? "Delete failed"); return; }
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch { toast.error("Network error"); }
    setDeleteTarget(null);
  }, [deleteTarget, qc]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-[14px] text-muted mt-1">Drag tasks between columns — double-click a column to expand</p>
        </div>
        <Button onClick={() => { setNewTaskStatus("backlog"); setModalOpen(true); }}>+ New Task</Button>
      </div>

      <ReportBadges badges={badges} />

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <div key={col.id} className="w-72 shrink-0">
              <div className="h-4 w-24 bg-muted-bg rounded-md animate-pulse mb-3" />
              <div className="glass rounded-[var(--radius)] p-2 space-y-2 min-h-[200px]">
                {[1, 2].map(i => <div key={i} className="h-20 bg-muted-bg rounded-[var(--radius-sm)] animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {columns.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                onAddTask={(status) => { setNewTaskStatus(status); setModalOpen(true); }}
                onDoubleClick={(colId) => setFullscreenCol(colId)}
                onClickTask={(t) => setViewTask(t)}
                userMap={userMap}
                userOptions={userOptions}
                projectMap={projectMap}
                milestoneMap={milestoneMap}
                onAssign={handleAssign}
                onStatusChange={(t) => setStatusTask(t)}
                onEdit={(t) => setEditingTask(t)}
                onDelete={(t) => setDeleteTarget(t)}
              />
            ))}
            <DragOverlay dropAnimation={null}>
              {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Task" description={`Adding to ${COLUMNS.find(c => c.id === newTaskStatus)?.title ?? "Backlog"}`} size="lg">
        <DynamicForm fields={taskFields} schema={taskSchema} onSubmit={handleCreateTask} submitLabel="Create Task" onCancel={() => setModalOpen(false)} columns={2} />
      </Modal>

      {/* Task detail panel */}
      {viewTask && (
        <TaskDetailPanel
          task={viewTask}
          onClose={() => setViewTask(null)}
          userMap={userMap}
        />
      )}

      {/* Edit modal */}
      <Modal
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
        description={editingTask?.title}
        size="lg"
      >
        <DynamicForm
          fields={taskFields}
          schema={taskSchema}
          onSubmit={handleEditSubmit}
          defaultValues={editingTask ? { ...editingTask, tags: Array.isArray(editingTask.tags) ? editingTask.tags.join(", ") : editingTask.tags } : undefined}
          submitLabel="Update"
          onCancel={() => setEditingTask(null)}
          columns={2}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />

      {/* Status picker */}
      <StatusPicker
        open={statusTask !== null}
        onClose={() => setStatusTask(null)}
        title={`Change Status — ${statusTask?.title ?? ""}`}
        currentStatus={statusTask?.status ?? ""}
        options={taskStatusOptions}
        onSelect={async (newStatus) => {
          if (!statusTask) return;
          await updateMutation.mutateAsync({ id: statusTask._id, body: { status: newStatus } });
          setStatusTask(null);
        }}
        isLoading={updateMutation.isPending}
      />

      {/* Fullscreen column */}
      {fullscreenColumn && (
        <FullscreenColumn
          column={fullscreenColumn}
          onClose={() => setFullscreenCol(null)}
          onClickTask={(t) => { setFullscreenCol(null); setViewTask(t); }}
        />
      )}
    </div>
  );
}
