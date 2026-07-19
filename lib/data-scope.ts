import "server-only";

import mongoose from "mongoose";
import type { SessionPayload } from "./auth";
import { ROLES } from "./permissions";

export type DataScopeFilter = Record<string, unknown>;

export function hasGlobalDataAccess(role: string) {
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}

export function mergeDataScope(
  baseFilter: DataScopeFilter,
  scopeFilter: DataScopeFilter
): DataScopeFilter {
  if (Object.keys(scopeFilter).length === 0) return { ...baseFilter };
  return { $and: [baseFilter, scopeFilter] };
}

export function createDataScopeResolver(session: SessionPayload) {
  const userId = new mongoose.Types.ObjectId(session.userId);
  const organisationId = new mongoose.Types.ObjectId(session.organisationId);
  const modelCache = new Map<string, Promise<DataScopeFilter>>();
  let projectIdsPromise: Promise<mongoose.Types.ObjectId[]> | undefined;
  let taskIdsPromise: Promise<mongoose.Types.ObjectId[]> | undefined;
  let leadIdsPromise: Promise<mongoose.Types.ObjectId[]> | undefined;
  let clientIdsPromise: Promise<mongoose.Types.ObjectId[]> | undefined;

  async function getRelatedLeadIds() {
    leadIdsPromise ??= (async () => {
      const Lead = (await import("@/models/Lead")).default;
      return normalizeObjectIds(
        await Lead.distinct("_id", {
          organisationId,
          $or: [{ ownerId: userId }, { createdBy: userId }],
        })
      );
    })();
    return leadIdsPromise;
  }

  async function getRelatedClientIds() {
    clientIdsPromise ??= (async () => {
      const Client = (await import("@/models/Client")).default;
      const leadIds = await getRelatedLeadIds();
      return normalizeObjectIds(
        await Client.distinct("_id", {
          organisationId,
          $or: [{ createdBy: userId }, { leadId: { $in: leadIds } }],
        })
      );
    })();
    return clientIdsPromise;
  }

  async function getRelatedProjectIds() {
    projectIdsPromise ??= (async () => {
      const [{ default: Project }, { default: ProjectMember }, { default: Task }] =
        await Promise.all([
          import("@/models/Project"),
          import("@/models/ProjectMember"),
          import("@/models/Task"),
        ]);
      const clientIds = await getRelatedClientIds();
      const directTaskFilter = {
        organisationId,
        $or: [
          { assigneeIds: userId },
          { reporterId: userId },
          { reviewerId: userId },
          { createdBy: userId },
        ],
      };

      const [ownedProjectIds, memberProjectIds, taskProjectIds] = await Promise.all([
        Project.distinct("_id", {
          organisationId,
          $or: [
            { ownerId: userId },
            { projectManagerId: userId },
            { clientId: { $in: clientIds } },
          ],
        }),
        ProjectMember.distinct("projectId", { organisationId, userId }),
        Task.distinct("projectId", directTaskFilter),
      ]);

      return normalizeObjectIds([
        ...ownedProjectIds,
        ...memberProjectIds,
        ...taskProjectIds,
      ]);
    })();
    return projectIdsPromise;
  }

  async function getRelatedTaskIds() {
    taskIdsPromise ??= (async () => {
      const Task = (await import("@/models/Task")).default;
      return normalizeObjectIds(
        await Task.distinct("_id", {
          organisationId,
          $or: [
            { assigneeIds: userId },
            { reporterId: userId },
            { reviewerId: userId },
            { createdBy: userId },
          ],
        })
      );
    })();
    return taskIdsPromise;
  }

  async function resolve(modelName: string): Promise<DataScopeFilter> {
    if (hasGlobalDataAccess(session.role)) return {};

    switch (modelName) {
      case "ApprovalRequest":
        return { $or: [{ requestedBy: userId }, { assignedTo: userId }] };
      case "Board":
        return { projectId: { $in: await getRelatedProjectIds() } };
      case "Client":
        return {
          $or: [
            { createdBy: userId },
            { leadId: { $in: await getRelatedLeadIds() } },
          ],
        };
      case "CompensationProfile":
      case "TeamMemberProfile":
        return { userId };
      case "FinancialSnapshot":
        return { projectId: { $in: await getRelatedProjectIds() } };
      case "Invoice":
        return { createdBy: userId };
      case "Lead":
        return { $or: [{ ownerId: userId }, { createdBy: userId }] };
      case "Notification":
        return { userId };
      case "OperationalExpense":
        return { createdBy: userId };
      case "Payment":
        return { recordedBy: userId };
      case "Project":
        return { _id: { $in: await getRelatedProjectIds() } };
      case "ProjectExpense":
        return {
          $or: [
            { submittedBy: userId },
            { approvedBy: userId },
          ],
        };
      case "ProjectMember":
        return { userId };
      case "ProjectMilestone":
        return { projectId: { $in: await getRelatedProjectIds() } };
      case "Proposal":
        return {
          $or: [
            { createdBy: userId },
            { leadId: { $in: await getRelatedLeadIds() } },
            { clientId: { $in: await getRelatedClientIds() } },
          ],
        };
      case "Task":
        return {
          $or: [
            { assigneeIds: userId },
            { reporterId: userId },
            { reviewerId: userId },
            { createdBy: userId },
          ],
        };
      case "TaskAttachment":
        return {
          $or: [
            { uploadedBy: userId },
            { taskId: { $in: await getRelatedTaskIds() } },
          ],
        };
      case "TaskChecklist":
        return {
          $or: [
            { completedBy: userId },
            { taskId: { $in: await getRelatedTaskIds() } },
          ],
        };
      case "TaskComment":
        return {
          $or: [
            { authorId: userId },
            { taskId: { $in: await getRelatedTaskIds() } },
          ],
        };
      case "User":
        return { _id: userId };
      default:
        return {};
    }
  }

  return (modelName: string) => {
    if (!modelCache.has(modelName)) {
      modelCache.set(modelName, resolve(modelName));
    }
    return modelCache.get(modelName)!;
  };
}

export async function getDataScopeFilter(
  modelName: string,
  session: SessionPayload
) {
  return createDataScopeResolver(session)(modelName);
}

function normalizeObjectIds(values: unknown[]) {
  const seen = new Set<string>();

  for (const value of values) {
    const stringValue =
      value instanceof mongoose.Types.ObjectId
        ? value.toString()
        : typeof value === "string"
          ? value
          : undefined;
    if (stringValue && mongoose.Types.ObjectId.isValid(stringValue)) {
      seen.add(stringValue);
    }
  }

  return [...seen].map((value) => new mongoose.Types.ObjectId(value));
}
