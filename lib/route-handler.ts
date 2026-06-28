import { type NextRequest } from "next/server";
import mongoose, { type Model, type Document } from "mongoose";
import connectDB from "./db";
import { type SessionPayload } from "./auth";
import { successResponse, errorResponse } from "./api-response";
import { generateRequestId } from "./correlation";
import { AuthenticationError, NotFoundError, ValidationError } from "./errors";
import { requirePermission, type Permission } from "./permissions";
import { createAuditLog } from "./audit";
import logger from "./logger";

interface CrudOptions {
  model: () => Promise<Model<Document & Record<string, unknown>>>;
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
      if (permissions?.list) requirePermission({ role: session.role, permission: permissions.list });

      await connectDB();
      const Model = await getModel();

      const { page, limit, search, sort, order, status } = parseSearchParams(request.url);
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = { organisationId: new mongoose.Types.ObjectId(session.organisationId) };

      if (status) filter.status = status;

      if (search && searchFields.length > 0) {
        filter.$or = searchFields.map((f) => ({
          [f]: { $regex: search, $options: "i" },
        }));
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
      if (permissions?.create) requirePermission({ role: session.role, permission: permissions.create });

      await connectDB();
      const Model = await getModel();

      const body = await request.json();
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
      logger.error(`${modelName}.create failed: ${msg}`, { requestId, errorCode: (error as { code?: string }).code });
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
      if (permissions?.get) requirePermission({ role: session.role, permission: permissions.get });

      await connectDB();
      const Model = await getModel();
      const { id } = await params;

      let query = Model.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organisationId: new mongoose.Types.ObjectId(session.organisationId),
      });

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
      if (permissions?.update) requirePermission({ role: session.role, permission: permissions.update });

      await connectDB();
      const Model = await getModel();
      const { id } = await params;
      const body = await request.json();

      delete body.organisationId;
      delete body._id;

      const prev = await Model.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organisationId: new mongoose.Types.ObjectId(session.organisationId),
      }).lean();

      if (!prev) throw new NotFoundError(modelName, id);

      const doc = await Model.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), organisationId: new mongoose.Types.ObjectId(session.organisationId) },
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
      logger.error(`${modelName}.update failed`, { requestId });
      return errorResponse(error, requestId);
    }
  }

  async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const requestId = generateRequestId();
    try {
      const session = await authenticate(request);
      if (permissions?.delete) requirePermission({ role: session.role, permission: permissions.delete });

      await connectDB();
      const Model = await getModel();
      const { id } = await params;

      const doc = await Model.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id),
        organisationId: new mongoose.Types.ObjectId(session.organisationId),
      }).lean();

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
