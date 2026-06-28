import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/TaskAttachment")).default as any,
  modelName: "TaskAttachment",
  permissions: {
    get: PERMISSIONS.TASK_CREATE,
    delete: PERMISSIONS.TASK_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
