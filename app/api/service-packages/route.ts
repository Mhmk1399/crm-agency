import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ServicePackage")).default,
  modelName: "ServicePackage",
  permissions: {
    list: PERMISSIONS.SERVICE_PACKAGES_VIEW,
    create: PERMISSIONS.SERVICE_PACKAGES_POST,
  },
  searchFields: ["name"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
