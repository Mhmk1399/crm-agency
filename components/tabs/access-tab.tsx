"use client";

import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "@/components/ui/toast";
import Button from "@/components/ui/button";
import {
  ACTIONS,
  buildPermission,
  type AccessAction,
  type AccessResourceId,
  type Permission,
  type Role,
} from "@/lib/permissions";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

interface AccessResource {
  id: AccessResourceId;
  label: string;
  group: string;
}

interface RoleAccess {
  role: Role;
  label: string;
  locked: boolean;
  permissions: Permission[];
  defaults: Permission[];
}

interface AccessResponse {
  actions: readonly AccessAction[];
  resources: readonly AccessResource[];
  roles: RoleAccess[];
}

type SelectionState = "all" | "some" | "none";

const ACTION_HINTS: Record<AccessAction, string> = {
  view: "Can see this section and its data",
  post: "Can create new entries",
  update: "Can edit existing entries",
  delete: "Can remove entries",
};

/** Shared column template so header, group rows and resource rows always align. */
const TABLE_GRID = "grid-cols-[minmax(10rem,1fr)_repeat(4,5rem)_4.5rem]";

const GHOST_BUTTON =
  "whitespace-nowrap rounded-[var(--radius-sm)] border border-separator px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-muted-bg hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

async function fetchAccess(): Promise<AccessResponse> {
  const res = await fetch("/api/access/roles");
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? "Failed to load access rules");
  }
  return json.data;
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect height="10" rx="2" width="14" x="5" y="11" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Custom checkbox (supports checked / indeterminate / disabled)       */
/* ------------------------------------------------------------------ */

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  size?: "sm" | "md";
  title?: string;
  onToggle: () => void;
}

function Checkbox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  size = "md",
  title,
  onToggle,
}: CheckboxProps) {
  const active = checked || indeterminate;
  return (
    <button
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      className={[
        "relative inline-flex shrink-0 items-center justify-center rounded-[0.375rem] border-[1.5px] transition-all duration-150",
        size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5",
        active
          ? "border-[var(--primary)] bg-[var(--primary)]"
          : "border-input-border bg-transparent",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer active:scale-90" +
            (active ? "" : " hover:border-[var(--primary)]"),
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1",
      ].join(" ")}
      disabled={disabled}
      onClick={onToggle}
      role="checkbox"
      title={title}
      type="button"
    >
      <svg
        aria-hidden="true"
        className={`absolute h-3 w-3 text-white transition-all duration-150 ${
          checked && !indeterminate ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        viewBox="0 0 12 12"
      >
        <path d="m2 6.6 2.7 2.7L10 3.6" />
      </svg>
      <svg
        aria-hidden="true"
        className={`absolute h-3 w-3 text-white transition-all duration-150 ${
          indeterminate ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={3}
        viewBox="0 0 12 12"
      >
        <path d="M2.5 6h7" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

function PanelSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="h-10 animate-pulse rounded-[var(--radius-sm)] bg-muted-bg"
          key={index}
          style={{ animationDelay: `${index * 70}ms` }}
        />
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="h-10 animate-pulse rounded-[var(--radius-sm)] bg-muted-bg"
          key={index}
          style={{ animationDelay: `${index * 70}ms` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function AccessTab() {
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role>("developer");
  const [draft, setDraft] = useState<Set<Permission> | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["access-rules"],
    queryFn: fetchAccess,
  });

  const selected = data?.roles.find((role) => role.role === selectedRole);
  const isLocked = selected?.locked ?? false;
  const totalPossible = (data?.resources.length ?? 0) * ACTIONS.length;

  const permissions = useMemo(
    () => draft ?? new Set(selected?.permissions ?? []),
    [draft, selected]
  );

  /** Number of permissions that differ from the saved state. */
  const changeCount = useMemo(() => {
    if (!draft || !selected) return 0;
    const base = new Set(selected.permissions);
    let count = 0;
    for (const permission of draft) if (!base.has(permission)) count += 1;
    for (const permission of base) if (!draft.has(permission)) count += 1;
    return count;
  }, [draft, selected]);

  const isDirty = changeCount > 0;

  const matchesDefaults = useMemo(() => {
    if (!selected) return true;
    const defaults = selected.defaults ?? [];
    if (permissions.size !== defaults.length) return false;
    return defaults.every((permission) => permissions.has(permission));
  }, [selected, permissions]);

  const groupedResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    const groups = new Map<string, AccessResource[]>();
    for (const resource of data?.resources ?? []) {
      if (
        query &&
        !resource.label.toLowerCase().includes(query) &&
        !resource.group.toLowerCase().includes(query)
      ) {
        continue;
      }
      const list = groups.get(resource.group) ?? [];
      list.push(resource);
      groups.set(resource.group, list);
    }
    return [...groups.entries()];
  }, [data?.resources, search]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/access/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, permissions: [...permissions] }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "Failed to save access rules");
      }
      return json.data;
    },
    onSuccess: () => {
      toast.success("Access rules saved");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["access-rules"] });
      qc.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  /* -------------------------- helpers ---------------------------- */

  function guardLocked(): boolean {
    if (!isLocked) return false;
    toast.info("Owner always has full access and cannot be restricted.");
    return true;
  }

  function selectionState(perms: readonly Permission[]): SelectionState {
    let count = 0;
    for (const permission of perms) if (permissions.has(permission)) count += 1;
    if (count === 0) return "none";
    return count === perms.length ? "all" : "some";
  }

  function enabledCount(perms: readonly Permission[]): number {
    let count = 0;
    for (const permission of perms) if (permissions.has(permission)) count += 1;
    return count;
  }

  function applyPermissions(perms: readonly Permission[], enable: boolean) {
    if (guardLocked()) return;
    const next = new Set(permissions);
    for (const permission of perms) {
      if (enable) next.add(permission);
      else next.delete(permission);
    }
    setDraft(next);
  }

  function toggleOne(resource: AccessResourceId, action: AccessAction) {
    if (guardLocked()) return;
    const permission = buildPermission(resource, action);
    const next = new Set(permissions);
    if (next.has(permission)) next.delete(permission);
    else next.add(permission);
    setDraft(next);
  }

  function toggleRow(resource: AccessResourceId) {
    const perms = ACTIONS.map((action) => buildPermission(resource, action));
    applyPermissions(perms, selectionState(perms) !== "all");
  }

  function toggleGroupAction(resources: AccessResource[], action: AccessAction) {
    const perms = resources.map((resource) => buildPermission(resource.id, action));
    applyPermissions(perms, selectionState(perms) !== "all");
  }

  function toggleGroup(resources: AccessResource[]) {
    const perms = resources.flatMap((resource) =>
      ACTIONS.map((action) => buildPermission(resource.id, action))
    );
    applyPermissions(perms, selectionState(perms) !== "all");
  }

  function selectRole(role: Role) {
    if (role === selectedRole) return;
    if (
      isDirty &&
      !window.confirm(
        `You have ${changeCount} unsaved change${changeCount === 1 ? "" : "s"} for ${
          selected?.label ?? "this role"
        }. Discard and switch roles?`
      )
    ) {
      return;
    }
    setSelectedRole(role);
    setDraft(null);
  }

  function resetToDefaults() {
    if (!selected || guardLocked()) return;
    setDraft(new Set(selected.defaults ?? []));
  }

  const roleCount = (role: RoleAccess) =>
    role.role === selectedRole ? permissions.size : role.permissions.length;

  /* --------------------------- render ----------------------------- */

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-clip">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Access Manager</h1>
          <p className="mt-1 text-[14px] text-muted">
            Control dashboard tabs and actions for every role.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {isDirty && (
            <button
              className={GHOST_BUTTON}
              onClick={() => setDraft(null)}
              type="button"
            >
              Discard
            </button>
          )}
          <button
            className={GHOST_BUTTON}
            disabled={
              isLoading || isLocked || matchesDefaults || saveMutation.isPending
            }
            onClick={resetToDefaults}
            type="button"
          >
            Reset to defaults
          </button>
          <Button
            className="whitespace-nowrap"
            disabled={!isDirty || isLocked}
            isLoading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save changes
          </Button>
        </div>
      </div>

      {/* Role selector — horizontal pills on mobile / tablet */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-muted-bg"
              key={index}
            />
          ))}
        {(data?.roles ?? []).map((role) => {
          const active = role.role === selectedRole;
          return (
            <button
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.97] ${
                active
                  ? "border-transparent bg-primary/10 text-primary"
                  : "border-separator text-muted"
              }`}
              key={role.role}
              onClick={() => selectRole(role.role)}
              type="button"
            >
              {role.label}
              {role.locked ? (
                <LockIcon className="h-3 w-3" />
              ) : (
                <span
                  className={`rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${
                    active ? "bg-primary/20" : "bg-muted-bg"
                  }`}
                >
                  {roleCount(role)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Roles sidebar — desktop only */}
        <aside className="glass hidden self-start overflow-hidden rounded-[var(--radius-lg)] lg:block">
          <div className="border-b border-separator px-4 py-3">
            <h2 className="text-[14px] font-semibold text-foreground">Roles</h2>
            <p className="text-[12px] text-muted">
              {data?.roles.length ?? 0} roles
            </p>
          </div>
          {isLoading ? (
            <SidebarSkeleton />
          ) : (
            <div className="space-y-1 p-2">
              {(data?.roles ?? []).map((role) => {
                const active = role.role === selectedRole;
                return (
                  <button
                    className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[14px] font-medium transition-all ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-muted-bg hover:text-foreground"
                    }`}
                    key={role.role}
                    onClick={() => selectRole(role.role)}
                    type="button"
                  >
                    <span className="truncate">{role.label}</span>
                    {role.locked ? (
                      <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                        FULL
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                          active
                            ? "bg-primary/20 text-primary"
                            : "bg-muted-bg text-muted"
                        }`}
                      >
                        {roleCount(role)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Permissions panel */}
        <div className="glass min-w-0 overflow-hidden rounded-[var(--radius-lg)]">
          {/* Panel header */}
          <div className="border-b border-separator px-4 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-foreground">
                    {selected?.label ?? "Role"} permissions
                  </h2>
                  {isDirty && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
                      {changeCount} unsaved
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-muted">
                  {isLoading
                    ? "Loading access rules…"
                    : `${permissions.size} of ${totalPossible} permissions enabled`}
                </p>
              </div>
              <div className="relative w-full xl:w-72">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="w-full rounded-[var(--radius-sm)] border border-separator bg-transparent py-2 pl-9 pr-9 text-[13px] text-foreground placeholder:text-muted focus:border-[var(--primary)] focus:outline-none"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search resources or groups…"
                  type="text"
                  value={search}
                />
                {search && (
                  <button
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-muted-bg hover:text-foreground"
                    onClick={() => setSearch("")}
                    type="button"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Locked notice */}
          {isLocked && (
            <div className="flex items-center gap-2 border-b border-separator bg-success/10 px-4 py-2.5">
              <LockIcon className="h-3.5 w-3.5 shrink-0 text-success" />
              <p className="text-[12px] font-medium text-success">
                Owner always has full access — these permissions can&apos;t be
                edited.
              </p>
            </div>
          )}

          {/* Panel body */}
          {isError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-[14px] font-semibold text-foreground">
                Couldn&apos;t load access rules
              </p>
              <p className="text-[13px] text-muted">
                Check your connection, then try again.
              </p>
              <button
                className={GHOST_BUTTON}
                onClick={() => refetch()}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <PanelSkeleton />
          ) : !selected ? (
            <div className="px-6 py-14 text-center text-[14px] text-muted">
              Select a role to manage its permissions.
            </div>
          ) : groupedResources.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted-bg">
                <SearchIcon className="h-5 w-5 text-muted" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">
                  No resources found
                </p>
                <p className="mt-0.5 text-[13px] text-muted">
                  Nothing matches “{search}”.
                </p>
              </div>
              <button
                className="text-[13px] font-semibold text-primary hover:underline"
                onClick={() => setSearch("")}
                type="button"
              >
                Clear search
              </button>
            </div>
          ) : (
            <>
              {/* ------------------ Desktop / tablet grid ------------------ */}
              <div className="hidden p-3 md:block">
                <div className="dynamic-table-scroll max-h-[calc(100vh-19rem)] overflow-auto rounded-[var(--radius-sm)] border border-separator">
                  <div className="min-w-[560px]">
                    {/* Sticky column header */}
                    <div
                      className={`sticky top-0 z-10 grid ${TABLE_GRID} items-center border-b border-separator bg-muted-bg px-3 py-2.5 backdrop-blur-md`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                        Resource
                      </span>
                      {ACTIONS.map((action) => (
                        <span
                          className="text-center text-[11px] font-bold uppercase tracking-[0.1em] text-muted"
                          key={action}
                          title={ACTION_HINTS[action]}
                        >
                          {action}
                        </span>
                      ))}
                      <span
                        className="text-center text-[11px] font-bold uppercase tracking-[0.1em] text-muted"
                        title="Toggle every action for a resource"
                      >
                        All
                      </span>
                    </div>

                    {groupedResources.map(([group, resources]) => {
                      const groupPerms = resources.flatMap((resource) =>
                        ACTIONS.map((action) =>
                          buildPermission(resource.id, action)
                        )
                      );
                      const groupState = selectionState(groupPerms);
                      return (
                        <Fragment key={group}>
                          {/* Group row with per-column bulk toggles */}
                          <div
                            className={`grid ${TABLE_GRID} items-center border-t border-separator bg-muted-bg px-3 py-2`}
                          >
                            <span className="flex min-w-0 items-center gap-2 pr-3">
                              <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                                {group}
                              </span>
                              <span className="shrink-0 rounded-full border border-separator px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted">
                                {enabledCount(groupPerms)}/{groupPerms.length}
                              </span>
                            </span>
                            {ACTIONS.map((action) => {
                              const actionPerms = resources.map((resource) =>
                                buildPermission(resource.id, action)
                              );
                              const state = selectionState(actionPerms);
                              return (
                                <span
                                  className="flex justify-center"
                                  key={action}
                                >
                                  <Checkbox
                                    checked={state === "all"}
                                    disabled={isLocked}
                                    indeterminate={state === "some"}
                                    label={`Toggle ${action} for all ${group} resources`}
                                    onToggle={() =>
                                      toggleGroupAction(resources, action)
                                    }
                                    size="sm"
                                    title={`Toggle “${action}” for every ${group} resource`}
                                  />
                                </span>
                              );
                            })}
                            <span className="flex justify-center">
                              <Checkbox
                                checked={groupState === "all"}
                                disabled={isLocked}
                                indeterminate={groupState === "some"}
                                label={`Toggle all permissions for ${group}`}
                                onToggle={() => toggleGroup(resources)}
                                size="sm"
                                title={`Toggle everything in ${group}`}
                              />
                            </span>
                          </div>

                          {/* Resource rows */}
                          {resources.map((resource) => {
                            const rowPerms = ACTIONS.map((action) =>
                              buildPermission(resource.id, action)
                            );
                            const rowState = selectionState(rowPerms);
                            return (
                              <div
                                className={`grid ${TABLE_GRID} items-center border-t border-separator px-3 py-2 transition-colors hover:bg-muted-bg`}
                                key={resource.id}
                              >
                                <span className="truncate pr-3 text-[14px] font-medium text-foreground">
                                  {resource.label}
                                </span>
                                {ACTIONS.map((action) => {
                                  const permission = buildPermission(
                                    resource.id,
                                    action
                                  );
                                  return (
                                    <span
                                      className="flex justify-center"
                                      key={permission}
                                    >
                                      <Checkbox
                                        checked={permissions.has(permission)}
                                        disabled={isLocked}
                                        label={`${resource.label}: ${action}`}
                                        onToggle={() =>
                                          toggleOne(resource.id, action)
                                        }
                                        title={permission}
                                      />
                                    </span>
                                  );
                                })}
                                <span className="flex justify-center">
                                  <Checkbox
                                    checked={rowState === "all"}
                                    disabled={isLocked}
                                    indeterminate={rowState === "some"}
                                    label={`Toggle all actions for ${resource.label}`}
                                    onToggle={() => toggleRow(resource.id)}
                                    title={`Toggle all actions for ${resource.label}`}
                                  />
                                </span>
                              </div>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ---------------------- Mobile cards ---------------------- */}
              <div className="space-y-6 p-3 md:hidden">
                {groupedResources.map(([group, resources]) => {
                  const groupPerms = resources.flatMap((resource) =>
                    ACTIONS.map((action) => buildPermission(resource.id, action))
                  );
                  const groupState = selectionState(groupPerms);
                  return (
                    <section key={group}>
                      <header className="mb-2 flex items-center justify-between gap-3 px-1">
                        <p className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                            {group}
                          </span>
                          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted">
                            {enabledCount(groupPerms)}/{groupPerms.length}
                          </span>
                        </p>
                        {!isLocked && (
                          <button
                            className="shrink-0 text-[12px] font-bold text-primary transition-opacity active:opacity-70"
                            onClick={() => toggleGroup(resources)}
                            type="button"
                          >
                            {groupState === "all" ? "Clear all" : "Select all"}
                          </button>
                        )}
                      </header>
                      <div className="space-y-2">
                        {resources.map((resource) => {
                          const rowPerms = ACTIONS.map((action) =>
                            buildPermission(resource.id, action)
                          );
                          const rowState = selectionState(rowPerms);
                          return (
                            <div
                              className="rounded-[var(--radius-sm)] border border-separator p-3"
                              key={resource.id}
                            >
                              <div className="mb-2.5 flex items-center justify-between gap-3">
                                <span className="truncate text-[14px] font-semibold text-foreground">
                                  {resource.label}
                                </span>
                                <Checkbox
                                  checked={rowState === "all"}
                                  disabled={isLocked}
                                  indeterminate={rowState === "some"}
                                  label={`Toggle all actions for ${resource.label}`}
                                  onToggle={() => toggleRow(resource.id)}
                                  size="sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {ACTIONS.map((action) => {
                                  const permission = buildPermission(
                                    resource.id,
                                    action
                                  );
                                  const checked = permissions.has(permission);
                                  return (
                                    <button
                                      aria-pressed={checked}
                                      className={[
                                        "flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-2 text-[12px] font-semibold capitalize transition-all",
                                        checked
                                          ? "border-transparent bg-primary/10 text-primary"
                                          : "border-separator text-muted",
                                        isLocked
                                          ? "cursor-not-allowed opacity-50"
                                          : "active:scale-[0.97]",
                                      ].join(" ")}
                                      disabled={isLocked}
                                      key={permission}
                                      onClick={() =>
                                        toggleOne(resource.id, action)
                                      }
                                      title={ACTION_HINTS[action]}
                                      type="button"
                                    >
                                      <span
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all ${
                                          checked
                                            ? "bg-[var(--primary)] text-white"
                                            : "border border-input-border"
                                        }`}
                                      >
                                        <svg
                                          aria-hidden="true"
                                          className={`h-2.5 w-2.5 transition-opacity ${
                                            checked
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={3}
                                          viewBox="0 0 12 12"
                                        >
                                          <path d="m2 6.6 2.7 2.7L10 3.6" />
                                        </svg>
                                      </span>
                                      {action}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating save bar — mobile only, appears with unsaved changes */}
      {isDirty && !isLocked && (
        <div className="pointer-events-none sticky bottom-4 z-30 flex justify-center md:hidden">
          <div className="glass pointer-events-auto flex items-center gap-1.5 rounded-full border border-separator py-1.5 pl-4 pr-1.5 shadow-xl">
            <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums text-foreground">
              {changeCount} change{changeCount === 1 ? "" : "s"}
            </span>
            <button
              className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-muted transition-opacity active:opacity-70"
              onClick={() => setDraft(null)}
              type="button"
            >
              Discard
            </button>
            <Button
              className="rounded-full px-4"
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}