import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Task")).default as any,
  modelName: "Task",
  permissions: {
    list: PERMISSIONS.TASK_CREATE,
    create: PERMISSIONS.TASK_CREATE,
  },
  searchFields: ["title"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
