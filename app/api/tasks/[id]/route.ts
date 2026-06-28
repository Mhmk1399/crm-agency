import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Task")).default as any,
  modelName: "Task",
  permissions: {
    get: PERMISSIONS.TASK_CREATE,
    update: PERMISSIONS.TASK_UPDATE,
    delete: PERMISSIONS.TASK_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
