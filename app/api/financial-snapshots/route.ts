import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/FinancialSnapshot")).default,
  modelName: "FinancialSnapshot",
  permissions: {
    list: PERMISSIONS.FINANCIAL_SNAPSHOTS_VIEW,
    create: PERMISSIONS.FINANCIAL_SNAPSHOTS_POST,
  },
  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
