import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/ServicePackage")).default,
  modelName: "ServicePackage",
  permissions: {
    get: PERMISSIONS.SERVICE_PACKAGES_VIEW,
    update: PERMISSIONS.SERVICE_PACKAGES_UPDATE,
    delete: PERMISSIONS.SERVICE_PACKAGES_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
