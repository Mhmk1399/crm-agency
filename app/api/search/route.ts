import type { NextRequest } from "next/server";
import mongoose, { type Model } from "mongoose";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { ValidationError } from "@/lib/errors";
import {
  buildPermission,
  hasGlobalDashboardAccess,
  hasPermission,
  type AccessResourceId,
} from "@/lib/permissions";
import { getPermissionsForRole } from "@/lib/permission-store";
import { createDataScopeResolver, mergeDataScope } from "@/lib/data-scope";
import type { TabId } from "@/components/dashboard/sidebar";

interface SearchResource {
  type: string;
  label: string;
  resource: AccessResourceId;
  tab: TabId;
  modelName: string;
  loader: () => Promise<Model<unknown>>;
  fields: string[];
  title: (doc: Record<string, unknown>) => string;
  subtitle: (doc: Record<string, unknown>) => string;
}

const MEMBER_SEARCH_RESOURCES = new Set<AccessResourceId>([
  "tasks",
  "invoices",
  "payments",
  "operational-expenses",
  "project-expenses",
  "users",
  "team-member-profiles",
  "compensation-profiles",
]);

const SEARCH_RESOURCES: SearchResource[] = [
  {
    type: "task",
    label: "Task",
    resource: "tasks",
    tab: "tasks",
    modelName: "Task",
    loader: async () => (await import("@/models/Task")).default,
    fields: ["title", "description", "status", "priority"],
    title: (doc) => text(doc.title, "Untitled task"),
    subtitle: (doc) => `Task · ${text(doc.status, "unknown").replace(/_/g, " ")}`,
  },
  {
    type: "project",
    label: "Project",
    resource: "projects",
    tab: "projects",
    modelName: "Project",
    loader: async () => (await import("@/models/Project")).default,
    fields: ["name", "projectCode", "description", "status"],
    title: (doc) => text(doc.name, "Untitled project"),
    subtitle: (doc) => `Project · ${text(doc.projectCode, "No code")}`,
  },
  {
    type: "lead",
    label: "Lead",
    resource: "leads",
    tab: "leads",
    modelName: "Lead",
    loader: async () => (await import("@/models/Lead")).default,
    fields: ["name", "companyName", "email", "status"],
    title: (doc) => text(doc.name, "Unnamed lead"),
    subtitle: (doc) => `Lead · ${text(doc.companyName, "No company")}`,
  },
  {
    type: "client",
    label: "Client",
    resource: "clients",
    tab: "clients",
    modelName: "Client",
    loader: async () => (await import("@/models/Client")).default,
    fields: ["name", "companyName", "email", "contactPerson"],
    title: (doc) => text(doc.companyName, text(doc.name, "Unnamed client")),
    subtitle: (doc) => `Client · ${text(doc.email, "No email")}`,
  },
  {
    type: "proposal",
    label: "Proposal",
    resource: "proposals",
    tab: "proposals",
    modelName: "Proposal",
    loader: async () => (await import("@/models/Proposal")).default,
    fields: ["title", "proposalNumber", "description", "status"],
    title: (doc) => text(doc.title, "Untitled proposal"),
    subtitle: (doc) => `Proposal · ${text(doc.proposalNumber, "No number")}`,
  },
  {
    type: "invoice",
    label: "Invoice",
    resource: "invoices",
    tab: "finance",
    modelName: "Invoice",
    loader: async () => (await import("@/models/Invoice")).default,
    fields: ["invoiceNumber", "status", "notes"],
    title: (doc) => text(doc.invoiceNumber, "Invoice"),
    subtitle: (doc) => `Invoice · ${formatMoney(doc.total, doc.currency)}`,
  },
  {
    type: "payment",
    label: "Payment",
    resource: "payments",
    tab: "finance",
    modelName: "Payment",
    loader: async () => (await import("@/models/Payment")).default,
    fields: ["reference", "method", "notes"],
    title: (doc) => text(doc.reference, text(doc.method, "Payment")),
    subtitle: (doc) => `Payment · ${formatMoney(doc.amount, doc.currency)}`,
  },
  {
    type: "operational-expense",
    label: "Operational Expense",
    resource: "operational-expenses",
    tab: "finance",
    modelName: "OperationalExpense",
    loader: async () => (await import("@/models/OperationalExpense")).default,
    fields: ["description", "category", "notes"],
    title: (doc) => text(doc.description, "Operational expense"),
    subtitle: (doc) => `Expense · ${formatMoney(doc.amount, doc.currency)}`,
  },
  {
    type: "project-expense",
    label: "Project Expense",
    resource: "project-expenses",
    tab: "finance",
    modelName: "ProjectExpense",
    loader: async () => (await import("@/models/ProjectExpense")).default,
    fields: ["description", "category"],
    title: (doc) => text(doc.description, "Project expense"),
    subtitle: (doc) => `Project expense · ${formatMoney(doc.amount, doc.currency)}`,
  },
  {
    type: "user",
    label: "User",
    resource: "users",
    tab: "team",
    modelName: "User",
    loader: async () => (await import("@/models/User")).default,
    fields: ["name", "email", "role"],
    title: (doc) => text(doc.name, "User"),
    subtitle: (doc) => `User · ${text(doc.email, "No email")}`,
  },
  {
    type: "profile",
    label: "Profile",
    resource: "team-member-profiles",
    tab: "team",
    modelName: "TeamMemberProfile",
    loader: async () => (await import("@/models/TeamMemberProfile")).default,
    fields: ["title", "department", "employmentType"],
    title: (doc) => text(doc.title, "Profile"),
    subtitle: (doc) => `Profile · ${text(doc.department, "No department")}`,
  },
];

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await requireAuth();
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) {
      return successResponse({ results: [] }, requestId);
    }
    if (query.length > 80) throw new ValidationError("Search query is too long");

    await connectDB();
    const permissions = await getPermissionsForRole(session.role, session.organisationId);
    const getDataScope = createDataScopeResolver(session);
    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const regex = { $regex: escapeRegex(query), $options: "i" };
    const globalDashboard = hasGlobalDashboardAccess(session.role);

    const results = (
      await Promise.all(
        SEARCH_RESOURCES.filter((resource) => {
          const canSearchDashboardResource =
            globalDashboard || MEMBER_SEARCH_RESOURCES.has(resource.resource);
          return (
            canSearchDashboardResource &&
            hasPermission(
              session.role,
              buildPermission(resource.resource, "view"),
              permissions
            )
          );
        }).map(async (resource) => {
          const Model = await resource.loader();
          const filter = mergeDataScope(
            {
              organisationId: orgId,
              $or: resource.fields.map((field) => ({ [field]: regex })),
            },
            await getDataScope(resource.modelName)
          );
          const docs = await Model.find(filter)
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(6)
            .lean();

          return docs.map((doc) => {
            const row = doc as Record<string, unknown>;
            return {
              id: String(row._id),
              type: resource.type,
              label: resource.label,
              title: resource.title(row),
              subtitle: resource.subtitle(row),
              tab: resource.tab,
            };
          });
        })
      )
    )
      .flat()
      .slice(0, 30);

    return successResponse({ results }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function formatMoney(value: unknown, currency: unknown) {
  const amount = typeof value === "number" ? value : 0;
  const cur = typeof currency === "string" ? currency : "IRR";
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B ${cur}`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M ${cur}`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K ${cur}`;
  return `${amount} ${cur}`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
