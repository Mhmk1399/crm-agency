"use client";

import { useQuery } from "@tanstack/react-query";

export interface Session {
  userId: string;
  organisationId: string;
  role: string;
  email: string;
  name: string;
}

const ADMIN_ROLES = ["owner", "admin", "project_manager"];
const SALES_ROLES = ["owner", "admin", "sales"];
const FINANCE_ROLES = ["owner", "admin", "finance"];

export function useSession() {
  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (!json.success) throw new Error("Not authenticated");
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const role = session?.role ?? "developer";
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSales = SALES_ROLES.includes(role);
  const isFinance = FINANCE_ROLES.includes(role);

  return { session, isLoading, role, isAdmin, isSales, isFinance };
}
