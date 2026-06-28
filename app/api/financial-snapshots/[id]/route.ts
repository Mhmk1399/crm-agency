import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/FinancialSnapshot")).default as any,
  modelName: "FinancialSnapshot",
  permissions: {
    get: PERMISSIONS.FINANCE_VIEW,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
