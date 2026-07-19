"use client";

import { useQuery } from "@tanstack/react-query";
import { hasPermission, type Permission, type Role } from "@/lib/permissions";

export interface Session {
  userId: string;
  organisationId: string;
  role: string;
  email: string;
  name: string;
  permissions: Permission[];
}

const ADMIN_ROLES = ["owner", "admin"];
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

  const role = (session?.role ?? "developer") as Role;
  const permissions = session?.permissions ?? [];
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSales = SALES_ROLES.includes(role);
  const isFinance = FINANCE_ROLES.includes(role);
  const can = (permission: Permission) => hasPermission(role, permission, permissions);

  return { session, isLoading, role, permissions, can, isAdmin, isSales, isFinance };
}
