"use client";

import { useState } from "react";
import Sidebar, { type TabId } from "@/components/dashboard/sidebar";
import { useSession } from "@/lib/use-session";
import OverviewTab from "@/components/tabs/overview-tab";
import LeadsTab from "@/components/tabs/leads-tab";
import ClientsTab from "@/components/tabs/clients-tab";
import ProposalsTab from "@/components/tabs/proposals-tab";
import ProjectsTab from "@/components/tabs/projects-tab";
import TasksTab from "@/components/tabs/tasks-tab";
import FinanceTab from "@/components/tabs/finance-tab";
import TeamTab from "@/components/tabs/team-tab";
import SettingsTab from "@/components/tabs/settings-tab";

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  dashboard: OverviewTab,
  leads: LeadsTab,
  clients: ClientsTab,
  proposals: ProposalsTab,
  projects: ProjectsTab,
  tasks: TasksTab,
  finance: FinanceTab,
  team: TeamTab,
  reports: () => <div className="space-y-4"><h1 className="text-2xl font-bold text-foreground">Reports</h1><p className="text-muted">Coming soon</p></div>,
  settings: SettingsTab,
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const { session } = useSession();

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} role={session?.role} userName={session?.name} />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}
