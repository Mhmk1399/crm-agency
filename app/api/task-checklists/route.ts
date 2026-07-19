import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/TaskChecklist")).default,
  modelName: "TaskChecklistItem",
  permissions: {
    list: PERMISSIONS.TASK_CHECKLISTS_VIEW,
    create: PERMISSIONS.TASK_CHECKLISTS_POST,
  },
  searchFields: ["title"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
