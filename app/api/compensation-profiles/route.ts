import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/CompensationProfile")).default as any,
  modelName: "CompensationProfile",
  permissions: {
    list: PERMISSIONS.FINANCE_VIEW,
    create: PERMISSIONS.FINANCE_MANAGE,
  },
  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
