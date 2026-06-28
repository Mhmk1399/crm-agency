import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/FinancialSnapshot")).default as any,
  modelName: "FinancialSnapshot",
  permissions: {
    list: PERMISSIONS.FINANCE_VIEW,
    create: PERMISSIONS.FINANCE_MANAGE,
  },
  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
