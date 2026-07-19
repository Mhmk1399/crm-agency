"use client";

import { useMemo, useState } from "react";
import CommandPalette from "@/components/dashboard/command-palette";
import Sidebar, { NAV_ITEMS, type TabId } from "@/components/dashboard/sidebar";
import { useSession } from "@/lib/use-session";
import {
  MEMBER_DASHBOARD_TAB_IDS,
  hasGlobalDashboardAccess,
  hasPermission,
  type Role,
} from "@/lib/permissions";
import OverviewTab from "@/components/tabs/overview-tab";
import MyWorkTab from "@/components/tabs/my-work-tab";
import LeadsTab from "@/components/tabs/leads-tab";
import ClientsTab from "@/components/tabs/clients-tab";
import ProposalsTab from "@/components/tabs/proposals-tab";
import ProjectsTab from "@/components/tabs/projects-tab";
import TasksTab from "@/components/tabs/tasks-tab";
import FinanceTab from "@/components/tabs/finance-tab";
import TeamTab from "@/components/tabs/team-tab";
import ProfileTab from "@/components/tabs/profile-tab";
import ReportsTab from "@/components/tabs/reports-tab";
import AccessTab from "@/components/tabs/access-tab";
import SettingsTab from "@/components/tabs/settings-tab";
import { useDashboardCounts } from "@/lib/use-dashboard-metrics";

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  dashboard: OverviewTab,
  "my-work": MyWorkTab,
  leads: LeadsTab,
  clients: ClientsTab,
  proposals: ProposalsTab,
  projects: ProjectsTab,
  tasks: TasksTab,
  finance: FinanceTab,
  team: TeamTab,
  profile: ProfileTab,
  reports: ReportsTab,
  access: AccessTab,
  settings: SettingsTab,
};

const MEMBER_DASHBOARD_TABS = new Set<string>(MEMBER_DASHBOARD_TAB_IDS);

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const {
    session,
    role,
    permissions,
    isLoading: sessionLoading,
  } = useSession();
  const { data: counts } = useDashboardCounts();
  const visibleItems = useMemo(
    () =>
      sessionLoading || !session
        ? []
        : NAV_ITEMS.filter((item) => {
            const canUseDashboardTab =
              hasGlobalDashboardAccess(role) ||
              MEMBER_DASHBOARD_TABS.has(item.id);
            const hasTabPermission =
              !item.permission ||
              hasGlobalDashboardAccess(role) ||
              hasPermission(role as Role, item.permission, permissions);

            return canUseDashboardTab && hasTabPermission;
          }),
    [permissions, role, session, sessionLoading],
  );
  const visibleTabs = useMemo(
    () => visibleItems.map((item) => item.id),
    [visibleItems],
  );

  const effectiveActiveTab =
    !sessionLoading &&
    visibleTabs.length > 0 &&
    !visibleTabs.includes(activeTab)
      ? visibleTabs[0]
      : activeTab;
  const ActiveComponent = TAB_COMPONENTS[effectiveActiveTab];
  const navCounts: Partial<Record<TabId, number>> = {
    "my-work": counts?.highlights.openTasks,
    leads: counts?.documents.leads,
    clients: counts?.documents.clients,
    proposals: counts?.documents.proposals,
    projects: counts?.documents.projects,
    tasks: counts?.highlights.openTasks,
    finance: counts?.totals.finance,
    team: counts?.documents.users,
    reports: counts?.totals.documents,
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <Sidebar
        activeTab={effectiveActiveTab}
        counts={navCounts}
        onTabChange={setActiveTab}
        role={session?.role}
        permissions={permissions}
        userName={session?.name}
        isLoading={sessionLoading}
      />
      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 motion-reduce:transition-none md:ml-[var(--sidebar-width,18rem)]">
        {!sessionLoading && visibleItems.length > 0 && (
          <CommandPalette
            activeTab={effectiveActiveTab}
            navigation={visibleItems.map((item) => ({
              id: item.id,
              label: item.label,
              section: item.section,
            }))}
            onTabChange={setActiveTab}
          />
        )}
        <div className="min-w-0 max-w-full px-4 pb-8 pt-20 sm:px-6 md:pt-6 lg:px-8 mt-12">
          {sessionLoading ? (
            <DashboardContentSkeleton />
          ) : visibleTabs.length === 0 ? (
            <div className="rounded-[var(--radius)] border border-separator bg-card p-6 text-sm text-muted">
              You do not have access to any dashboard tabs. Ask an owner to
              update your role permissions.
            </div>
          ) : (
            <ActiveComponent />
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardContentSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading dashboard">
      <div className="space-y-2">
        <div className="h-7 w-44 animate-pulse rounded-full bg-muted-bg" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-muted-bg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--radius)] border border-separator bg-card p-4"
          >
            <div className="mb-5 h-4 w-20 animate-pulse rounded-full bg-muted-bg" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted-bg" />
          </div>
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-[var(--radius)] border border-separator bg-card" />
    </div>
  );
}
