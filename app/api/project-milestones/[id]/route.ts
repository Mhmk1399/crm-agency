import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/ProjectMilestone")).default,
  modelName: "ProjectMilestone",
  permissions: {
    get: PERMISSIONS.PROJECT_MILESTONES_VIEW,
    update: PERMISSIONS.PROJECT_MILESTONES_UPDATE,
    delete: PERMISSIONS.PROJECT_MILESTONES_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
