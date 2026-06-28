"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";

// ── Types ──
interface Task {
  _id: string; title: string; description?: string; status: string;
  priority: string; type: string; assigneeIds: string[];
  projectId?: string; milestoneId?: string; reviewerId?: string;
  complexityPoints: number; estimatedMinutes: number; actualMinutes: number;
  estimatedCost: number; actualCost: number;
  isBillable: boolean; billableValue: number;
  startDate?: string; dueDate?: string; completedAt?: string;
  tags: string[]; revisionNumber: number;
  blockedReason?: string;
  createdAt: string; updatedAt?: string;
  [key: string]: unknown;
}
interface Comment { _id: string; content: string; authorId: string; createdAt: string }
interface ChecklistItem { _id: string; title: string; isCompleted: boolean; order: number; completedAt?: string }
interface Attachment { _id: string; fileName: string; fileUrl: string; fileSize: number; mimeType: string; createdAt: string }

const priorityVariant: Record<string, "destructive" | "warning" | "primary" | "default"> = { urgent: "destructive", high: "warning", medium: "primary", low: "default" };
const statusVariant: Record<string, "default" | "primary" | "success" | "warning" | "destructive"> = { backlog: "default", todo: "primary", in_progress: "warning", review: "primary", blocked: "destructive", done: "success" };

const fmt = (v: number) => {
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M T";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K T";
  return v + " T";
};

function fmtTime(min: number) {
  if (min === 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtSize(bytes: number) {
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + " MB";
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + " KB";
  return bytes + " B";
}

// ── Sub-entity fetcher ──
function useTaskSub<T>(taskId: string, endpoint: string) {
  return useQuery<T[]>({
    queryKey: [endpoint, taskId],
    queryFn: async () => {
      const res = await fetch(`/api/${endpoint}?limit=100&taskId=${taskId}`);
      const json = await res.json();
      return json.success ? (json.data?.data ?? []) : [];
    },
  });
}

// ── Main component ──
export default function TaskDetailPanel({ task, onClose, userMap }: {
  task: Task; onClose: () => void; userMap: Map<string, string>;
}) {
  const qc = useQueryClient();
  const tid = task._id;

  const { data: comments = [] } = useTaskSub<Comment>(tid, "task-comments");
  const { data: checklist = [] } = useTaskSub<ChecklistItem>(tid, "task-checklists");
  const { data: attachments = [] } = useTaskSub<Attachment>(tid, "task-attachments");

  const { data: projectName } = useQuery<string>({
    queryKey: ["project-name", task.projectId],
    enabled: !!task.projectId,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${task.projectId}`);
      const json = await res.json();
      return json.success ? json.data.name : null;
    },
  });

  const { data: milestoneName } = useQuery<string>({
    queryKey: ["milestone-name", task.milestoneId],
    enabled: !!task.milestoneId,
    queryFn: async () => {
      const res = await fetch(`/api/project-milestones/${task.milestoneId}`);
      const json = await res.json();
      return json.success ? json.data.title : null;
    },
  });

  const [newComment, setNewComment] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Mutations ──
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/task-comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: tid, content }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => { setNewComment(""); qc.invalidateQueries({ queryKey: ["task-comments", tid] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/task-comments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-comments", tid] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addCheckItem = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/task-checklists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: tid, title, order: checklist.length }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => { setNewCheckItem(""); qc.invalidateQueries({ queryKey: ["task-checklists", tid] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCheckItem = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const body: Record<string, unknown> = { isCompleted: done };
      if (done) body.completedAt = new Date().toISOString();
      const res = await fetch(`/api/task-checklists/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-checklists", tid] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCheckItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/task-checklists/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-checklists", tid] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addAttachment = useMutation({
    mutationFn: async (data: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }) => {
      const res = await fetch("/api/task-attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: tid, ...data }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-attachments", tid] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAttachment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/task-attachments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-attachments", tid] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const completedChecks = checklist.filter(c => c.isCompleted).length;
  const checkPct = checklist.length > 0 ? Math.round((completedChecks / checklist.length) * 100) : 0;

  const assigneeNames = task.assigneeIds?.map(id => userMap.get(id) ?? "Unknown") ?? [];

  return (
    <Modal open onClose={onClose} title={task.title} size="xl">
      <div className="space-y-6 mt-2">
        {/* Project & Milestone */}
        {(projectName || milestoneName) && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            {projectName && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                {projectName}
              </span>
            )}
            {milestoneName && (
              <span className="inline-flex items-center gap-1.5 bg-warning/10 text-warning rounded-full px-2.5 py-1 font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                {milestoneName}
              </span>
            )}
          </div>
        )}

        {/* Top badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant[task.status] ?? "default"}>{task.status.replace(/_/g, " ")}</Badge>
          <Badge variant={priorityVariant[task.priority] ?? "default"}>{task.priority}</Badge>
          <Badge variant="default">{task.type.replace(/_/g, " ")}</Badge>
          {task.isBillable && <Badge variant="success">Billable</Badge>}
          {overdue && <Badge variant="destructive">Overdue</Badge>}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Estimated", value: fmtTime(task.estimatedMinutes) },
            { label: "Actual", value: fmtTime(task.actualMinutes) },
            { label: "Est. Cost", value: task.estimatedCost ? fmt(task.estimatedCost) : "—" },
            { label: "Actual Cost", value: task.actualCost ? fmt(task.actualCost) : "—" },
          ].map(c => (
            <div key={c.label} className="glass rounded-[var(--radius-sm)] p-2.5 text-center">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{c.label}</p>
              <p className="text-[15px] font-bold text-foreground mt-0.5">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Dates + assignees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
          <div className="space-y-1.5">
            {task.startDate && <p className="text-muted">Start: <span className="text-foreground">{new Date(task.startDate).toLocaleDateString()}</span></p>}
            {task.dueDate && <p className={overdue ? "text-destructive font-medium" : "text-muted"}>Due: <span className={overdue ? "" : "text-foreground"}>{new Date(task.dueDate).toLocaleDateString()}</span></p>}
            {task.completedAt && <p className="text-muted">Completed: <span className="text-success">{new Date(task.completedAt).toLocaleDateString()}</span></p>}
            {task.blockedReason && <p className="text-destructive">Blocked: {task.blockedReason}</p>}
          </div>
          <div className="space-y-1.5">
            <p className="text-muted">Assignees: {assigneeNames.length > 0 ? <span className="text-foreground">{assigneeNames.join(", ")}</span> : <span className="italic">None</span>}</p>
            {task.revisionNumber > 0 && <p className="text-muted">Revision: <span className="text-foreground">#{task.revisionNumber}</span></p>}
            {task.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.map(t => <span key={t} className="bg-muted-bg text-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">{t}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-1.5">Description</h4>
            <p className="text-[13px] text-foreground whitespace-pre-wrap bg-muted-bg rounded-lg p-3">{task.description}</p>
          </div>
        )}

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider">Checklist ({completedChecks}/{checklist.length})</h4>
            {checklist.length > 0 && <span className="text-[11px] text-muted">{checkPct}%</span>}
          </div>
          {checklist.length > 0 && (
            <div className="h-1.5 rounded-full bg-muted-bg overflow-hidden mb-3">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${checkPct}%` }} />
            </div>
          )}
          <div className="space-y-1">
            {[...checklist].sort((a, b) => a.order - b.order).map(item => (
              <div key={item._id} className="flex items-center gap-2.5 group py-1">
                <button onClick={() => toggleCheckItem.mutate({ id: item._id, done: !item.isCompleted })}
                  className={`w-4.5 h-4.5 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                    item.isCompleted ? "bg-success border-success text-white" : "border-input-border hover:border-primary"
                  }`}>
                  {item.isCompleted && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
                <span className={`flex-1 text-[13px] ${item.isCompleted ? "line-through text-muted" : "text-foreground"}`}>{item.title}</span>
                <button onClick={() => deleteCheckItem.mutate(item._id)}
                  className="p-0.5 rounded text-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text" value={newCheckItem}
              onChange={e => setNewCheckItem(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newCheckItem.trim()) { addCheckItem.mutate(newCheckItem.trim()); } }}
              placeholder="Add item..."
              className="flex-1 rounded-lg bg-input-bg px-3 py-2 text-[13px] text-foreground border border-input-border outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-input-focus"
            />
            <button onClick={() => { if (newCheckItem.trim()) addCheckItem.mutate(newCheckItem.trim()); }}
              disabled={!newCheckItem.trim()}
              className="px-3 py-2 rounded-lg bg-primary text-white text-[12px] font-semibold disabled:opacity-30 hover:bg-primary-hover transition-all">
              Add
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2">Attachments ({attachments.length})</h4>
          {attachments.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {attachments.map(att => (
                <div key={att._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted-bg group">
                  <div className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{att.fileName}</p>
                      <p className="text-[10px] text-muted">{fmtSize(att.fileSize)} — {new Date(att.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteAttachment.mutate(att._id)}
                    className="p-1 rounded text-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              const url = prompt("Attachment URL:");
              if (!url) return;
              const name = url.split("/").pop() ?? "file";
              addAttachment.mutate({ fileName: name, fileUrl: url, fileSize: 0, mimeType: "application/octet-stream" });
            }}
            className="text-[12px] font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Add attachment
          </button>
        </div>

        {/* Comments */}
        <div>
          <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2">Comments ({comments.length})</h4>
          {comments.length > 0 && (
            <div className="space-y-3 mb-3">
              {[...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(c => (
                <div key={c._id} className="flex gap-3 group">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {(userMap.get(c.authorId) ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-foreground">{userMap.get(c.authorId) ?? "Unknown"}</span>
                      <span className="text-[10px] text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                      <button onClick={() => deleteComment.mutate(c._id)}
                        className="p-0.5 rounded text-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-all ml-auto">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </div>
                    <p className="text-[13px] text-foreground mt-0.5 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={commentInputRef}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && newComment.trim()) { e.preventDefault(); addComment.mutate(newComment.trim()); } }}
              placeholder="Write a comment... (Enter to send)"
              rows={2}
              className="flex-1 rounded-lg bg-input-bg px-3 py-2 text-[13px] text-foreground border border-input-border outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-input-focus resize-none"
            />
            <button onClick={() => { if (newComment.trim()) addComment.mutate(newComment.trim()); }}
              disabled={!newComment.trim()}
              className="px-3 self-end rounded-lg bg-primary text-white text-[12px] font-semibold py-2 disabled:opacity-30 hover:bg-primary-hover transition-all">
              Send
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
