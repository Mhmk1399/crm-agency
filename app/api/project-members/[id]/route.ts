import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/ProjectMember")).default as any,
  modelName: "ProjectMember",
  permissions: {
    get: PERMISSIONS.PROJECT_VIEW,
    update: PERMISSIONS.PROJECT_UPDATE,
    delete: PERMISSIONS.PROJECT_UPDATE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
