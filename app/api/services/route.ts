import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Service")).default,
  modelName: "Service",
  permissions: {
    list: PERMISSIONS.SERVICES_VIEW,
    create: PERMISSIONS.SERVICES_POST,
  },
  searchFields: ["name", "category"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
