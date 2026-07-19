import { type NextRequest } from "next/server";
import mongoose, { type Model } from "mongoose";
import connectDB from "./db";
import { type SessionPayload } from "./auth";
import { successResponse, errorResponse } from "./api-response";
import { generateRequestId } from "./correlation";
import { AuthenticationError, NotFoundError, ValidationError } from "./errors";
import {
  buildPermission,
  type AccessResourceId,
  type Permission,
} from "./permissions";
import { requirePermission } from "./permission-store";
import { createDataScopeResolver, mergeDataScope } from "./data-scope";
import { createAuditLog } from "./audit";
import logger from "./logger";

interface CrudOptions {
  model: () => Promise<Model<unknown>>;
  modelName: string;
  permissions?: {
    list?: Permission;
    get?: Permission;
    create?: Permission;
    update?: Permission;
    delete?: Permission;
  };
  searchFields?: string[];
  defaultSort?: Record<string, 1 | -1>;
  populateFields?: string[];
  sensitiveFields?: string[];
}

const MODEL_RESOURCE: Record<string, AccessResourceId> = {
  ApprovalRequest: "approvals",
  Board: "boards",
  Client: "clients",
  CompensationProfile: "compensation-profiles",
  FinancialSnapshot: "financial-snapshots",
  Invoice: "invoices",
  Lead: "leads",
  Notification: "notifications",
  OperationalExpense: "operational-expenses",
  Payment: "payments",
  Project: "projects",
  ProjectExpense: "project-expenses",
  ProjectMember: "project-members",
  ProjectMilestone: "project-milestones",
  Proposal: "proposals",
  Service: "services",
  ServicePackage: "service-packages",
  Task: "tasks",
  TaskAttachment: "task-attachments",
  TaskChecklist: "task-checklists",
  TaskComment: "task-comments",
  TeamMemberProfile: "team-member-profiles",
  User: "users",
};

function inferredPermission(
  modelName: string,
  action: "view" | "post" | "update" | "delete"
) {
  const resource = MODEL_RESOURCE[modelName];
  return resource ? buildPermission(resource, action) : undefined;
}

function isRecordWithId(value: unknown): value is { _id: unknown } {
  return typeof value === "object" && value !== null && "_id" in value;
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message };
  }
  return { errorMessage: String(error) };
}

function sanitizeBodyForModel(Model: Model<unknown>, body: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    const schemaType = Model.schema.path(key) as
      | { instance?: string; caster?: { instance?: string } }
      | undefined;

    if (!schemaType) {
      cleaned[key] = value;
      continue;
    }

    if (isRecordWithId(value) && schemaType.instance === "ObjectId") {
      cleaned[key] = value._id;
      continue;
    }

    if (Array.isArray(value) && schemaType.instance === "Array") {
      const casterType = schemaType.caster?.instance;
      cleaned[key] = casterType === "ObjectId"
        ? value.map((item) => (isRecordWithId(item) ? item._id : item)).filter((item) => item !== "")
        : value;
      continue;
    }

    if (value === "" && ["ObjectId", "Date"].includes(schemaType.instance ?? "")) {
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

async function authenticate(request: NextRequest): Promise<SessionPayload> {
  const token = request.cookies.get("session")?.value;
  if (!token) throw new AuthenticationError();
  const { decrypt } = await import("./auth");
  const session = await decrypt(token);
  if (!session) throw new AuthenticationError();
  return session;
}

function parseSearchParams(url: string) {
  const { searchParams } = new URL(url);
  return {
    page: Math.max(1, parseInt(searchParams.get("page") ?? "1")),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20"))),
    search: searchParams.get("search") ?? "",
    sort: searchParams.get("sort") ?? "",
    order: searchParams.get("order") === "desc" ? -1 as const : 1 as const,
    status: searchParams.get("status") ?? "",
  };
}

export function createCrudHandlers(options: CrudOptions) {
  const { model: getModel, modelName, permissions, searchFields = [], defaultSort = { createdAt: -1 }, populateFields = [] } = options;

  async function GET(request: NextRequest) {
    const requestId = generateRequestId();
    try {
      const session = await authenticate(request);
      const permission = permissions?.list ?? inferredPermission(modelName, "view");
      if (permission) await requirePermission({ role: session.role, organisationId: session.organisationId, permission });

      await connectDB();
      const Model = await getModel();
      const getDataScope = createDataScopeResolver(session);

      const { page, limit, search, sort, order, status } = parseSearchParams(request.url);
      const skip = (page - 1) * limit;

      const filter = mergeDataScope(
        { organisationId: new mongoose.Types.ObjectId(session.organisationId) },
        await getDataScope(modelName)
      );

      if (status) filter.status = status;

      if (search && searchFields.length > 0) {
        const searchOr = searchFields.map((f) => ({
          [f]: { $regex: search, $options: "i" },
        }));

        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
          delete filter.$or;
        } else {
          filter.$or = searchOr;
        }
      }

      const sortObj = sort ? { [sort]: order } : defaultSort;

      let query = Model.find(filter).sort(sortObj).skip(skip).limit(limit);
      for (const field of populateFields) {
        query = query.populate(field, "name email");
      }

      const [data, total] = await Promise.all([
        query.lean(),
        Model.countDocuments(filter),
      ]);

      return successResponse({ data, total, page, limit, totalPages: Math.ceil(total / limit) }, requestId);
    } catch (error) {
      logger.error(`${modelName}.list failed`, { requestId, errorCode: (error as { code?: string }).code });
      return errorResponse(error, requestId);
    }
  }

  async function POST(request: NextRequest) {
    const requestId = generateRequestId();
    try {
      const session = await authenticate(request);
      const permission = permissions?.create ?? inferredPermission(modelName, "post");
      if (permission) await requirePermission({ role: session.role, organisationId: session.organisationId, permission });

      await connectDB();
      const Model = await getModel();

      const body = sanitizeBodyForModel(Model, await request.json());
      const uid = new mongoose.Types.ObjectId(session.userId);
      body.organisationId = new mongoose.Types.ObjectId(session.organisationId);
      if (!body.createdBy) body.createdBy = uid;
      if (!body.ownerId) body.ownerId = uid;
      if (!body.reporterId) body.reporterId = uid;
      if (!body.requestedBy) body.requestedBy = uid;
      if (!body.submittedBy) body.submittedBy = uid;
      if (!body.performedBy) body.performedBy = uid;
      if (!body.conductedBy) body.conductedBy = uid;
      if (!body.changedBy) body.changedBy = uid;
      if (!body.authorId) body.authorId = uid;
      if (!body.uploadedBy) body.uploadedBy = uid;
      if (!body.recordedBy) body.recordedBy = uid;
      if (!body.userId) body.userId = uid;
      if (!body.reviewerId) body.reviewerId = uid;
      if (!body.assignedTo) body.assignedTo = uid;
      if (!body.requestedBy) body.requestedBy = uid;
      if (!body.projectManagerId) body.projectManagerId = uid;
      if (!body.contactPerson && body.name) body.contactPerson = body.name;

      const doc = await Model.create(body);

      await createAuditLog({
        organisationId: session.organisationId,
        actor: session.userId,
        action: `${modelName}.created`,
        entityType: modelName,
        entityId: doc._id.toString(),
        newValue: body,
        requestId,
      });

      logger.info(`${modelName} created`, { requestId, organisationId: session.organisationId, entityId: doc._id.toString(), module: modelName, action: "create" });

      return successResponse(doc.toObject(), requestId, 201);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return errorResponse(new ValidationError("Duplicate entry", (error as { keyValue?: Record<string, unknown> }).keyValue ?? {}), requestId);
      }
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`${modelName}.create failed: ${msg}`, { requestId, errorCode: (error as { code?: string }).code, ...formatError(error) });
      return errorResponse(error, requestId);
    }
  }

  return { GET, POST };
}

export function createDetailHandlers(options: CrudOptions) {
  const { model: getModel, modelName, permissions, populateFields = [] } = options;

  async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const requestId = generateRequestId();
    try {
      const session = await authenticate(request);
      const permission = permissions?.get ?? inferredPermission(modelName, "view");
      if (permission) await requirePermission({ role: session.role, organisationId: session.organisationId, permission });

      await connectDB();
      const Model = await getModel();
      const getDataScope = createDataScopeResolver(session);
      const { id } = await params;
      const filter = mergeDataScope(
        {
          _id: new mongoose.Types.ObjectId(id),
          organisationId: new mongoose.Types.ObjectId(session.organisationId),
        },
        await getDataScope(modelName)
      );

      let query = Model.findOne(filter);

      for (const field of populateFields) {
        query = query.populate(field, "name email");
      }

      const doc = await query.lean();
      if (!doc) throw new NotFoundError(modelName, id);

      return successResponse(doc, requestId);
    } catch (error) {
      logger.error(`${modelName}.get failed`, { requestId });
      return errorResponse(error, requestId);
    }
  }

  async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const requestId = generateRequestId();
    try {
      const session = await authenticate(request);
      const permission = permissions?.update ?? inferredPermission(modelName, "update");
      if (permission) await requirePermission({ role: session.role, organisationId: session.organisationId, permission });

      await connectDB();
      const Model = await getModel();
      const getDataScope = createDataScopeResolver(session);
      const { id } = await params;
      const body = sanitizeBodyForModel(Model, await request.json());

      delete body.organisationId;
      delete body._id;

      const filter = mergeDataScope(
        {
          _id: new mongoose.Types.ObjectId(id),
          organisationId: new mongoose.Types.ObjectId(session.organisationId),
        },
        await getDataScope(modelName)
      );

      const prev = await Model.findOne(filter).lean();

      if (!prev) throw new NotFoundError(modelName, id);

      const doc = await Model.findOneAndUpdate(
        filter,
        { $set: body },
        { new: true, runValidators: true }
      ).lean();

      await createAuditLog({
        organisationId: session.organisationId,
        actor: session.userId,
        action: `${modelName}.updated`,
        entityType: modelName,
        entityId: id,
        previousValue: prev as Record<string, unknown>,
        newValue: body,
        requestId,
      });

      logger.info(`${modelName} updated`, { requestId, organisationId: session.organisationId, entityId: id, module: modelName, action: "update" });

      return successResponse(doc, requestId);
    } catch (error) {
      logger.error(`${modelName}.update failed`, { requestId, errorCode: (error as { code?: string }).code, ...formatError(error) });
      return errorResponse(error, requestId);
    }
  }

  async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const requestId = generateRequestId();
    try {
      const session = await authenticate(request);
      const permission = permissions?.delete ?? inferredPermission(modelName, "delete");
      if (permission) await requirePermission({ role: session.role, organisationId: session.organisationId, permission });

      await connectDB();
      const Model = await getModel();
      const getDataScope = createDataScopeResolver(session);
      const { id } = await params;

      const doc = await Model.findOneAndDelete(
        mergeDataScope(
          {
            _id: new mongoose.Types.ObjectId(id),
            organisationId: new mongoose.Types.ObjectId(session.organisationId),
          },
          await getDataScope(modelName)
        )
      ).lean();

      if (!doc) throw new NotFoundError(modelName, id);

      await createAuditLog({
        organisationId: session.organisationId,
        actor: session.userId,
        action: `${modelName}.deleted`,
        entityType: modelName,
        entityId: id,
        previousValue: doc as Record<string, unknown>,
        requestId,
      });

      logger.info(`${modelName} deleted`, { requestId, organisationId: session.organisationId, entityId: id, module: modelName, action: "delete" });

      return successResponse({ deleted: true }, requestId);
    } catch (error) {
      logger.error(`${modelName}.delete failed`, { requestId });
      return errorResponse(error, requestId);
    }
  }

  return { GET, PATCH, DELETE };
}
