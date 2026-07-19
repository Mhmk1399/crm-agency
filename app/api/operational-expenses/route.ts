import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/OperationalExpense")).default,
  modelName: "OperationalExpense",
  permissions: {
    list: PERMISSIONS.OPERATIONAL_EXPENSES_VIEW,
    create: PERMISSIONS.OPERATIONAL_EXPENSES_POST,
  },
  searchFields: ["description"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
