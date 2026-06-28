import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/ProjectExpense")).default as any,
  modelName: "ProjectExpense",
  permissions: {
    get: PERMISSIONS.FINANCE_VIEW,
    update: PERMISSIONS.FINANCE_MANAGE,
    delete: PERMISSIONS.FINANCE_MANAGE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
