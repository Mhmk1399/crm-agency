import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/TaskComment")).default,
  modelName: "TaskComment",
  permissions: {
    get: PERMISSIONS.TASK_COMMENTS_VIEW,
    update: PERMISSIONS.TASK_COMMENTS_UPDATE,
    delete: PERMISSIONS.TASK_COMMENTS_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
