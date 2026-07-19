"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  MEMBER_DASHBOARD_TAB_IDS,
  PERMISSIONS,
  hasGlobalDashboardAccess,
  type Permission,
} from "@/lib/permissions";

export type TabId =
  | "dashboard"
  | "my-work"
  | "leads"
  | "clients"
  | "proposals"
  | "projects"
  | "tasks"
  | "finance"
  | "team"
  | "profile"
  | "reports"
  | "access"
  | "settings";

/**
 * `section` groups items visually in the sidebar. The array order is
 * unchanged so any other consumers of NAV_ITEMS keep working.
 */
export const NAV_ITEMS: {
  label: string;
  id: TabId;
  icon: string;
  section: string;
  permission?: Permission;
}[] = [
  {
    label: "Dashboard",
    id: "dashboard",
    icon: "grid",
    section: "Workspace",
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    label: "My Work",
    id: "my-work",
    icon: "briefcase",
    section: "Workspace",
  },
  {
    label: "Profile",
    id: "profile",
    icon: "user",
    section: "Workspace",
  },
  {
    label: "Leads",
    id: "leads",
    icon: "target",
    section: "CRM",
    permission: PERMISSIONS.LEADS_VIEW,
  },
  {
    label: "Clients",
    id: "clients",
    icon: "users",
    section: "CRM",
    permission: PERMISSIONS.CLIENTS_VIEW,
  },
  {
    label: "Proposals",
    id: "proposals",
    icon: "file-text",
    section: "CRM",
    permission: PERMISSIONS.PROPOSALS_VIEW,
  },
  {
    label: "Projects",
    id: "projects",
    icon: "folder",
    section: "Workspace",
    permission: PERMISSIONS.PROJECTS_VIEW,
  },
  {
    label: "Tasks",
    id: "tasks",
    icon: "check-square",
    section: "Workspace",
    permission: PERMISSIONS.TASKS_VIEW,
  },
  {
    label: "Finance",
    id: "finance",
    icon: "dollar-sign",
    section: "Finance",
    permission: PERMISSIONS.FINANCE_VIEW,
  },
  {
    label: "Team",
    id: "team",
    icon: "people",
    section: "Admin",
    permission: PERMISSIONS.TEAM_VIEW,
  },
  {
    label: "Reports",
    id: "reports",
    icon: "bar-chart",
    section: "Finance",
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    label: "Access",
    id: "access",
    icon: "shield",
    section: "Admin",
    permission: PERMISSIONS.ACCESS_VIEW,
  },
  {
    label: "Settings",
    id: "settings",
    icon: "settings",
    section: "Admin",
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

const MEMBER_DASHBOARD_TABS = new Set<string>(MEMBER_DASHBOARD_TAB_IDS);

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    briefcase: (
      <>
        <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 12h18" />
        <path d="M12 12v2" />
      </>
    ),
    "file-text": (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
    folder: (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    ),
    "check-square": (
      <>
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    "dollar-sign": (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    "bar-chart": (
      <>
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </>
    ),
    people: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {icons[name] ?? icons.grid}
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function CountBadge({
  value,
  active,
  className = "",
}: {
  value?: number;
  active: boolean;
  className?: string;
}) {
  if (value === undefined) return null;

  const label = value > 999 ? "999+" : String(value);

  return (
    <span
      className={`ml-auto min-w-6 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold tabular-nums ${
        active ? "bg-primary text-white" : "bg-muted-bg text-muted"
      } ${className}`}
    >
      {label}
    </span>
  );
}

function UserAvatar({ name }: { name?: string }) {
  const initials = (name ?? "User")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
      {initials}
    </div>
  );
}

interface TooltipState {
  label: string;
  sub?: string;
  top: number;
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  activeTab: TabId;
  counts?: Partial<Record<TabId, number>>;
  onTabChange: (tab: TabId) => void;
  role?: string;
  permissions?: readonly Permission[];
  userName?: string;
  isLoading?: boolean;
}

export default function Sidebar({
  activeTab,
  counts,
  onTabChange,
  role,
  permissions = [],
  userName,
  isLoading = false,
}: SidebarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const visibleItems = useMemo(
    () =>
      isLoading || !role
        ? []
        : NAV_ITEMS.filter(
            (item) => {
              const canUseDashboardTab =
                hasGlobalDashboardAccess(role) || MEMBER_DASHBOARD_TABS.has(item.id);
              const hasTabPermission =
                !item.permission ||
                hasGlobalDashboardAccess(role) ||
                permissions.includes(item.permission);

              return canUseDashboardTab && hasTabPermission;
            },
          ),
    [isLoading, permissions, role],
  );

  /** Items grouped by section, keeping section order of first appearance. */
  const sections = useMemo(() => {
    const map = new Map<string, typeof visibleItems>();
    for (const item of visibleItems) {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    }
    return [...map.entries()];
  }, [visibleItems]);

  const activeItem =
    visibleItems.find((item) => item.id === activeTab) ?? visibleItems[0];

  /** First four visible items go in the mobile bottom tab bar. */
  const tabBarItems = visibleItems.slice(0, 4);

  /* ------------------- responsive behaviour ----------------------- */

  // Auto-collapse to an icon rail on tablet; restore the saved
  // preference on desktop; react live to viewport changes.
  useEffect(() => {
    const tabletQuery = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023.98px)",
    );
    const readStored = () => {
      try {
        return window.localStorage.getItem("crm-sidebar-collapsed") === "1";
      } catch {
        return false;
      }
    };
    const sync = () => setCollapsed(tabletQuery.matches ? true : readStored());
    sync();
    tabletQuery.addEventListener("change", sync);
    return () => tabletQuery.removeEventListener("change", sync);
  }, []);

  // Close the mobile drawer automatically when crossing into md+.
  useEffect(() => {
    const mdQuery = window.matchMedia("(min-width: 768px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    mdQuery.addEventListener("change", onChange);
    return () => mdQuery.removeEventListener("change", onChange);
  }, []);

  // Expose the current width so the page layout can offset content:
  // use `md:pl-[var(--sidebar-width,18rem)]` on the content wrapper.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "4.75rem" : "18rem",
    );
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [collapsed]);

  // Drawer open: lock body scroll, close on Escape, focus the close button.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  /* --------------------------- tooltips --------------------------- */

  function showTooltip(label: string, sub?: string) {
    return (
      event: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
    ) => {
      if (!collapsed) return;
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({ label, sub, top: rect.top + rect.height / 2 });
    };
  }

  const hideTooltip = () => setTooltip(null);

  /* --------------------------- actions ----------------------------- */

  function toggleCollapsed() {
    setTooltip(null);
    setCollapsed((previous) => {
      const next = !previous;
      try {
        if (window.matchMedia("(min-width: 1024px)").matches) {
          window.localStorage.setItem(
            "crm-sidebar-collapsed",
            next ? "1" : "0",
          );
        }
      } catch {
        /* storage unavailable — ignore */
      }
      return next;
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out");
      setLogoutOpen(false);
      setMobileOpen(false);
      router.push("/login");
    } catch {
      toast.error("Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  }

  function selectTab(tab: TabId) {
    onTabChange(tab);
    setMobileOpen(false);
    setTooltip(null);
  }

  /* --------------------------- skeleton ---------------------------- */

  const navSkeleton = (
    <div aria-label="Loading navigation" className="space-y-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 ${
            collapsed ? "md:justify-center md:px-0" : ""
          }`}
          key={index}
        >
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-muted-bg" />
          <div
            className={`h-3.5 animate-pulse rounded-full bg-muted-bg ${
              collapsed ? "md:hidden" : ""
            }`}
            style={{
              width: `${index % 3 === 0 ? 52 : index % 3 === 1 ? 68 : 44}%`,
            }}
          />
        </div>
      ))}
    </div>
  );

  /* ------------------------- nav content --------------------------- */

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={`px-4 py-5 ${collapsed ? "md:px-3" : ""}`}>
        <div
          className={`flex items-center gap-3 rounded-[var(--radius)] bg-muted-bg px-3 py-3 ${
            collapsed ? "md:justify-center md:bg-transparent md:p-0" : ""
          }`}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm"
            onMouseEnter={showTooltip("Agency CRM")}
            onMouseLeave={hideTooltip}
          >
            <svg
              fill="none"
              height="19"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.3"
              viewBox="0 0 24 24"
              width="19"
            >
              <path d="M12 2 2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <h2 className="truncate text-[15px] font-bold leading-tight text-foreground">
              Agency CRM
            </h2>
            <p className="text-[11px] text-muted">Business Operating System</p>
          </div>
          <button
            aria-label="Close navigation"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(false)}
            ref={closeButtonRef}
            type="button"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 overflow-y-auto px-3 pb-3 ${
          collapsed ? "md:px-2" : ""
        }`}
        onScroll={hideTooltip}
      >
        {isLoading || !role
          ? navSkeleton
          : sections.map(([section, items], sectionIndex) => (
              <div className={sectionIndex > 0 ? "mt-4" : ""} key={section}>
                <div
                  className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted ${
                    collapsed ? "md:hidden" : ""
                  }`}
                >
                  {section}
                </div>
                {sectionIndex > 0 && (
                  <div
                    aria-hidden="true"
                    className={`mx-2 mb-3 hidden border-t border-separator ${
                      collapsed ? "md:block" : ""
                    }`}
                  />
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const active = activeTab === item.id;
                    const count = counts?.[item.id];
                    const tooltipLabel =
                      count !== undefined
                        ? `${item.label} · ${count > 999 ? "999+" : count}`
                        : item.label;
                    return (
                      <button
                        aria-current={active ? "page" : undefined}
                        aria-label={item.label}
                        className={`group relative flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-[14px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] motion-reduce:transition-none ${
                          collapsed ? "md:justify-center md:gap-0 md:px-0" : ""
                        } ${
                          active
                            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10"
                            : "text-muted hover:bg-muted-bg hover:text-foreground"
                        }`}
                        key={item.id}
                        onBlur={hideTooltip}
                        onClick={() => selectTab(item.id)}
                        onFocus={showTooltip(tooltipLabel)}
                        onMouseEnter={showTooltip(tooltipLabel)}
                        onMouseLeave={hideTooltip}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-200 ${
                            active ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <span
                          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            active ? "bg-primary/10" : "bg-transparent"
                          }`}
                        >
                          <NavIcon name={item.icon} />
                          {count !== undefined && count > 0 && (
                            <span
                              aria-hidden="true"
                              className={`absolute -right-0.5 -top-0.5 hidden h-2 w-2 rounded-full bg-primary ring-2 ring-card ${
                                collapsed ? "md:block" : ""
                              }`}
                            />
                          )}
                        </span>
                        <span
                          className={`truncate ${collapsed ? "md:hidden" : ""}`}
                        >
                          {item.label}
                        </span>
                        <CountBadge
                          active={active}
                          className={collapsed ? "md:hidden" : ""}
                          value={count}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
      </nav>

      {/* Footer: user + logout */}
      <div
        className={`border-t border-separator p-3 ${
          collapsed ? "md:px-2" : ""
        }`}
      >
        {isLoading || !role ? (
          <div className="mb-2 flex items-center gap-3 rounded-[var(--radius-sm)] bg-muted-bg px-3 py-2.5">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-background" />
            <div
              className={`min-w-0 flex-1 space-y-2 ${
                collapsed ? "md:hidden" : ""
              }`}
            >
              <div className="h-3.5 w-24 animate-pulse rounded-full bg-background" />
              <div className="h-2.5 w-16 animate-pulse rounded-full bg-background" />
            </div>
          </div>
        ) : (
          userName && (
            <div
              className={`mb-2 flex items-center gap-3 rounded-[var(--radius-sm)] bg-muted-bg px-3 py-2.5 ${
                collapsed
                  ? "md:justify-center md:bg-transparent md:px-0 md:py-1"
                  : ""
              }`}
              onMouseEnter={showTooltip(userName, role.replace(/_/g, " "))}
              onMouseLeave={hideTooltip}
            >
              <UserAvatar name={userName} />
              <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {userName}
                </p>
                <p className="truncate text-[10px] capitalize text-muted">
                  {role.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          )
        )}
        <button
          aria-label="Log out"
          className={`flex min-h-10 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[14px] font-medium text-muted transition-all duration-200 hover:bg-destructive/8 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 ${
            collapsed ? "md:justify-center md:gap-0 md:px-0" : ""
          }`}
          disabled={isLoading || !role}
          onBlur={hideTooltip}
          onClick={() => setLogoutOpen(true)}
          onFocus={showTooltip("Log out")}
          onMouseEnter={showTooltip("Log out")}
          onMouseLeave={hideTooltip}
          type="button"
        >
          <LogoutIcon />
          <span className={collapsed ? "md:hidden" : ""}>Logout</span>
        </button>
      </div>
    </div>
  );

  /* ---------------------------- render ------------------------------ */

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-card-border bg-card/90 px-4 backdrop-blur-[var(--blur)] md:hidden">
        <button
          aria-controls="app-sidebar"
          aria-expanded={mobileOpen}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-input-border bg-background text-foreground transition-transform active:scale-95"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <div className="min-w-0 px-3 text-center">
          {isLoading || !role ? (
            <div className="mx-auto space-y-2">
              <div className="mx-auto h-3.5 w-24 animate-pulse rounded-full bg-muted-bg" />
              <div className="mx-auto h-2.5 w-16 animate-pulse rounded-full bg-muted-bg" />
            </div>
          ) : (
            <>
              <p className="flex items-center justify-center gap-1.5 truncate text-[14px] font-semibold text-foreground">
                {activeItem?.label ?? "Dashboard"}
              </p>
              <p className="text-[11px] text-muted">Agency CRM</p>
            </>
          )}
        </div>
        {isLoading || !role ? (
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted-bg" />
        ) : (
          <UserAvatar name={userName} />
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[var(--blur)] md:hidden"
      >
        {isLoading || !role ? (
          <div className="flex items-center justify-around px-4 py-2.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-9 w-11 animate-pulse rounded-lg bg-muted-bg"
                key={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex">
            {tabBarItems.map((item) => {
              const active = activeTab === item.id;
              const count = counts?.[item.id];
              return (
                <button
                  aria-current={active ? "page" : undefined}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[10px] font-semibold transition-all active:scale-95 ${
                    active ? "text-primary" : "text-muted"
                  }`}
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  type="button"
                >
                  <span className="relative">
                    <NavIcon name={item.icon} />
                    {count !== undefined && count > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold tabular-nums text-white">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate">{item.label}</span>
                </button>
              );
            })}
            {visibleItems.length > 4 && (
              <button
                aria-controls="app-sidebar"
                aria-expanded={mobileOpen}
                aria-label="Open full navigation"
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[10px] font-semibold transition-all active:scale-95 ${
                  mobileOpen ? "text-primary" : "text-muted"
                }`}
                onClick={() => setMobileOpen(true)}
                type="button"
              >
                <svg
                  fill="currentColor"
                  height="18"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <circle cx="5" cy="12" r="1.7" />
                  <circle cx="12" cy="12" r="1.7" />
                  <circle cx="19" cy="12" r="1.7" />
                </svg>
                <span className="max-w-full truncate">Menu</span>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Drawer overlay (fades in/out) */}
      <button
        aria-hidden={!mobileOpen}
        aria-label="Close navigation"
        className={`fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
        tabIndex={mobileOpen ? 0 : -1}
        type="button"
      />

      {/* Sidebar: drawer on mobile, rail/expanded panel on md+ */}
      <aside
        aria-label="Sidebar"
        className={`fixed left-0 top-0 z-50 h-dvh w-[min(85vw,19rem)] border-r border-card-border bg-card/95 shadow-2xl backdrop-blur-[var(--blur)] transition-[transform,width] duration-300 will-change-transform motion-reduce:transition-none md:translate-x-0 md:shadow-none ${
          collapsed ? "md:w-[4.75rem]" : "md:w-72"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        id="app-sidebar"
      >
        {navContent}

        {/* Collapse / expand toggle (md+) */}
        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-9 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-card-border bg-card text-muted shadow-sm transition-all hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:flex"
          onBlur={hideTooltip}
          onClick={toggleCollapsed}
          onFocus={showTooltip("Expand sidebar")}
          onMouseEnter={showTooltip("Expand sidebar")}
          onMouseLeave={hideTooltip}
          title={collapsed ? undefined : "Collapse sidebar"}
          type="button"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-300 motion-reduce:transition-none ${
              collapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m14 17-5-5 5-5" />
          </svg>
        </button>
      </aside>

      {/* Shared tooltip for the collapsed rail */}
      {tooltip && collapsed && (
        <div
          className="pointer-events-none fixed z-[70] hidden -translate-y-1/2 md:block"
          role="tooltip"
          style={{ left: "calc(4.75rem + 12px)", top: tooltip.top }}
        >
          <div className="relative rounded-[var(--radius-sm)] border border-card-border bg-card px-3 py-1.5 shadow-lg">
            <span
              aria-hidden="true"
              className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-card-border bg-card"
            />
            <p className="whitespace-nowrap text-[12.5px] font-semibold text-foreground">
              {tooltip.label}
            </p>
            {tooltip.sub && (
              <p className="whitespace-nowrap text-[11px] capitalize text-muted">
                {tooltip.sub}
              </p>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        cancelLabel="Stay logged in"
        confirmLabel="Log out"
        isLoading={loggingOut}
        message="Are you sure you want to end your session and return to the login page?"
        onCancel={() => {
          if (!loggingOut) setLogoutOpen(false);
        }}
        onConfirm={handleLogout}
        open={logoutOpen}
        title="Log out?"
        variant="destructive"
      />
    </>
  );
}
