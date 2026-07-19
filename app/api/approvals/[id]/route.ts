import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/ApprovalRequest")).default,
  modelName: "ApprovalRequest",
  permissions: {
    get: PERMISSIONS.APPROVALS_VIEW,
    update: PERMISSIONS.APPROVALS_UPDATE,
    delete: PERMISSIONS.APPROVALS_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
