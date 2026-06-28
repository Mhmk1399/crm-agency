import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Project")).default as any,
  modelName: "Project",
  permissions: {
    get: PERMISSIONS.PROJECT_VIEW,
    update: PERMISSIONS.PROJECT_UPDATE,
  },
  populateFields: ["clientId", "projectManagerId"],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
