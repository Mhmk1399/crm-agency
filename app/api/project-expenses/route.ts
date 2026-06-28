import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ProjectExpense")).default as any,
  modelName: "ProjectExpense",
  permissions: {
    list: PERMISSIONS.FINANCE_VIEW,
    create: PERMISSIONS.FINANCE_MANAGE,
  },
  searchFields: ["description"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
