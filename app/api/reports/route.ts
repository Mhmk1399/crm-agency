import type { NextRequest } from "next/server";
import mongoose, { type Model, type PipelineStage } from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { requireAuth } from "@/lib/auth";
import { AuthorizationError, ValidationError } from "@/lib/errors";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getPermissionsForRole, requirePermission } from "@/lib/permission-store";
import { REPORT_RESOURCES, getReportResource } from "@/lib/report-definitions";
import { createDataScopeResolver, mergeDataScope } from "@/lib/data-scope";

const MODEL_LOADERS: Partial<Record<string, () => Promise<Model<unknown>>>> = {
  leads: async () => (await import("@/models/Lead")).default,
  clients: async () => (await import("@/models/Client")).default,
  proposals: async () => (await import("@/models/Proposal")).default,
  projects: async () => (await import("@/models/Project")).default,
  tasks: async () => (await import("@/models/Task")).default,
  invoices: async () => (await import("@/models/Invoice")).default,
  payments: async () => (await import("@/models/Payment")).default,
  "operational-expenses": async () => (await import("@/models/OperationalExpense")).default,
  "project-expenses": async () => (await import("@/models/ProjectExpense")).default,
  users: async () => (await import("@/models/User")).default,
  "team-member-profiles": async () => (await import("@/models/TeamMemberProfile")).default,
  "compensation-profiles": async () => (await import("@/models/CompensationProfile")).default,
  "project-milestones": async () => (await import("@/models/ProjectMilestone")).default,
  "project-members": async () => (await import("@/models/ProjectMember")).default,
  "financial-snapshots": async () => (await import("@/models/FinancialSnapshot")).default,
  services: async () => (await import("@/models/Service")).default,
  "service-packages": async () => (await import("@/models/ServicePackage")).default,
  boards: async () => (await import("@/models/Board")).default,
  approvals: async () => (await import("@/models/ApprovalRequest")).default,
  notifications: async () => (await import("@/models/Notification")).default,
  "task-comments": async () => (await import("@/models/TaskComment")).default,
  "task-checklists": async () => (await import("@/models/TaskChecklist")).default,
  "task-attachments": async () => (await import("@/models/TaskAttachment")).default,
};

const RESOURCE_MODEL_NAMES: Record<string, string> = {
  approvals: "ApprovalRequest",
  boards: "Board",
  clients: "Client",
  "compensation-profiles": "CompensationProfile",
  "financial-snapshots": "FinancialSnapshot",
  invoices: "Invoice",
  leads: "Lead",
  notifications: "Notification",
  "operational-expenses": "OperationalExpense",
  payments: "Payment",
  projects: "Project",
  "project-expenses": "ProjectExpense",
  "project-members": "ProjectMember",
  "project-milestones": "ProjectMilestone",
  proposals: "Proposal",
  services: "Service",
  "service-packages": "ServicePackage",
  tasks: "Task",
  "task-attachments": "TaskAttachment",
  "task-checklists": "TaskChecklist",
  "task-comments": "TaskComment",
  "team-member-profiles": "TeamMemberProfile",
  users: "User",
};

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await requireAuth();
    await requirePermission({
      role: session.role,
      organisationId: session.organisationId,
      permission: PERMISSIONS.REPORTS_VIEW,
    });

    const permissions = await getPermissionsForRole(session.role, session.organisationId);
    const allowedResources = REPORT_RESOURCES.filter((resource) =>
      hasPermission(session.role, resource.permission, permissions)
    );

    const resourceId =
      request.nextUrl.searchParams.get("resource") ?? allowedResources[0]?.id;
    if (!resourceId) throw new AuthorizationError("You do not have access to report data.");

    const resource = getReportResource(resourceId);
    const getModel = MODEL_LOADERS[resourceId];
    if (!resource || !getModel) throw new ValidationError("Invalid report resource.");
    if (!allowedResources.some((item) => item.id === resource.id)) {
      throw new AuthorizationError("You do not have access to this report.");
    }

    await connectDB();
    const Model = await getModel();
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") ?? 25)));
    const skip = (page - 1) * limit;
    const sortField = resource.columns.some((column) => column.key === params.get("sort"))
      ? params.get("sort")!
      : resource.defaultSort;
    const sortDir = params.get("order") === "asc" ? 1 : -1;

    const getDataScope = createDataScopeResolver(session);
    const filter = mergeDataScope(
      buildFilter({
        params,
        resource,
        organisationId: session.organisationId,
      }),
      await getDataScope(RESOURCE_MODEL_NAMES[resourceId] ?? "")
    );

    const sort = { [sortField]: sortDir } as Record<string, 1 | -1>;
    const projection = Object.fromEntries(resource.columns.map((column) => [column.key, 1]));
    projection._id = 1;

    const [rows, total, numericSummaries, grouped] = await Promise.all([
      Model.find(filter).select(projection).sort(sort).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
      buildNumericSummaries(Model, filter, resource.numericFields.map((field) => field.value)),
      buildGroupedSummary(Model, filter, resource.filters[0]?.key),
    ]);

    return successResponse(
      {
        resources: allowedResources,
        resource,
        rows,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        numericSummaries,
        grouped,
      },
      requestId
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

function buildFilter({
  params,
  resource,
  organisationId,
}: {
  params: URLSearchParams;
  resource: NonNullable<ReturnType<typeof getReportResource>>;
  organisationId: string;
}) {
  const filter: Record<string, unknown> = {
    organisationId: new mongoose.Types.ObjectId(organisationId),
  };

  const search = params.get("search")?.trim();
  if (search) {
    filter.$or = resource.searchFields.map((field) => ({
      [field]: { $regex: escapeRegex(search), $options: "i" },
    }));
  }

  const dateField = params.get("dateField") ?? resource.dateFields[0]?.value;
  if (dateField && resource.dateFields.some((field) => field.value === dateField)) {
    const from = parseDateStart(params.get("from"));
    const to = parseDateEnd(params.get("to"));
    if (from || to) {
      filter[dateField] = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }
  }

  for (const item of resource.filters) {
    const value = params.get(`f_${item.key}`);
    if (!value) continue;
    if (item.type === "boolean") filter[item.key] = value === "true";
    else if (item.options?.some((option) => option.value === value)) filter[item.key] = value;
  }

  for (const field of resource.numericFields) {
    const min = parseNumber(params.get(`min_${field.value}`));
    const max = parseNumber(params.get(`max_${field.value}`));
    if (min === undefined && max === undefined) continue;
    filter[field.value] = {
      ...(min !== undefined ? { $gte: min } : {}),
      ...(max !== undefined ? { $lte: max } : {}),
    };
  }

  return filter;
}

async function buildNumericSummaries(
  Model: Model<unknown>,
  filter: Record<string, unknown>,
  fields: string[]
) {
  if (fields.length === 0) return {};

  const group = fields.reduce<Record<string, unknown>>(
    (acc, field) => {
      acc[`${field}Sum`] = { $sum: `$${field}` };
      acc[`${field}Avg`] = { $avg: `$${field}` };
      acc[`${field}Min`] = { $min: `$${field}` };
      acc[`${field}Max`] = { $max: `$${field}` };
      return acc;
    },
    { _id: null }
  );

  const pipeline: PipelineStage[] = [
    { $match: filter },
    { $group: group as PipelineStage.Group["$group"] },
  ];
  const [summary] = await Model.aggregate(pipeline);
  return summary ?? {};
}

async function buildGroupedSummary(
  Model: Model<unknown>,
  filter: Record<string, unknown>,
  field?: string
) {
  if (!field) return [];
  return Model.aggregate([
    { $match: filter },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);
}

function parseDateStart(value: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseDateEnd(value: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseNumber(value: string | null) {
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
