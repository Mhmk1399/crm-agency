import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/ProjectMember")).default,
  modelName: "ProjectMember",
  permissions: {
    get: PERMISSIONS.PROJECT_MEMBERS_VIEW,
    update: PERMISSIONS.PROJECT_MEMBERS_UPDATE,
    delete: PERMISSIONS.PROJECT_MEMBERS_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
