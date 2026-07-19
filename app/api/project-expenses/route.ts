import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ProjectExpense")).default,
  modelName: "ProjectExpense",
  permissions: {
    list: PERMISSIONS.PROJECT_EXPENSES_VIEW,
    create: PERMISSIONS.PROJECT_EXPENSES_POST,
  },
  searchFields: ["description"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
