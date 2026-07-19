import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/OperationalExpense")).default,
  modelName: "OperationalExpense",
  permissions: {
    get: PERMISSIONS.OPERATIONAL_EXPENSES_VIEW,
    update: PERMISSIONS.OPERATIONAL_EXPENSES_UPDATE,
    delete: PERMISSIONS.OPERATIONAL_EXPENSES_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
