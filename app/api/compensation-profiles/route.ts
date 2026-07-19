import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/CompensationProfile")).default,
  modelName: "CompensationProfile",
  permissions: {
    list: PERMISSIONS.COMPENSATION_PROFILES_VIEW,
    create: PERMISSIONS.COMPENSATION_PROFILES_POST,
  },
  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
