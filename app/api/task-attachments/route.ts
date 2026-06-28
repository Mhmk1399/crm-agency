import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/TaskAttachment")).default as any,
  modelName: "TaskAttachment",
  permissions: {
    list: PERMISSIONS.TASK_CREATE,
    create: PERMISSIONS.TASK_CREATE,
  },
  searchFields: ["fileName"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
