import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/TaskComment")).default,
  modelName: "TaskComment",
  permissions: {
    list: PERMISSIONS.TASK_COMMENTS_VIEW,
    create: PERMISSIONS.TASK_COMMENTS_POST,
  },
  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
