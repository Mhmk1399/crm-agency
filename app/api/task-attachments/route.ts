import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/TaskAttachment")).default,
  modelName: "TaskAttachment",
  permissions: {
    list: PERMISSIONS.TASK_ATTACHMENTS_VIEW,
    create: PERMISSIONS.TASK_ATTACHMENTS_POST,
  },
  searchFields: ["fileName"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
