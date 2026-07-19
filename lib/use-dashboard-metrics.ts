"use client";

import { useQuery } from "@tanstack/react-query";

export interface DashboardCounts {
  documents: {
    approvals: number;
    boards: number;
    clients: number;
    compensationProfiles: number;
    financialSnapshots: number;
    invoices: number;
    leads: number;
    notifications: number;
    operationalExpenses: number;
    payments: number;
    projects: number;
    projectExpenses: number;
    projectMembers: number;
    projectMilestones: number;
    proposals: number;
    services: number;
    servicePackages: number;
    tasks: number;
    taskAttachments: number;
    taskChecklists: number;
    taskComments: number;
    teamMemberProfiles: number;
    users: number;
  };
  highlights: {
    activeProjects: number;
    activeUsers: number;
    openLeads: number;
    openProposals: number;
    openTasks: number;
    overdueInvoices: number;
    overdueTasks: number;
    pendingApprovals: number;
    unreadNotifications: number;
  };
  totals: {
    crm: number;
    delivery: number;
    finance: number;
    team: number;
    documents: number;
  };
  generatedAt: string;
}

export interface OwnerStats {
  activeProjects: number;
  atRiskProjects: number;
  criticalProjects: number;
  pipelineLeadCount: number;
  pipelineValue: number;
  weightedPipelineValue: number;
  monthlyRevenue: number;
  outstandingInvoices: number;
  overdueTasks: number;
  overdueInvoices: number;
}

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message ?? "Request failed");
  }

  return json.data;
}

export function useDashboardCounts() {
  return useQuery<DashboardCounts>({
    queryKey: ["dashboard", "counts"],
    queryFn: () => fetchApi<DashboardCounts>("/api/dashboard/counts"),
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useOwnerStats() {
  return useQuery<OwnerStats>({
    queryKey: ["dashboard", "owner"],
    queryFn: () => fetchApi<OwnerStats>("/api/dashboard/owner"),
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
