import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/ProjectExpense")).default,
  modelName: "ProjectExpense",
  permissions: {
    get: PERMISSIONS.PROJECT_EXPENSES_VIEW,
    update: PERMISSIONS.PROJECT_EXPENSES_UPDATE,
    delete: PERMISSIONS.PROJECT_EXPENSES_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
