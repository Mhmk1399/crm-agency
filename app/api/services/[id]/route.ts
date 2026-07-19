import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Service")).default,
  modelName: "Service",
  permissions: {
    get: PERMISSIONS.SERVICES_VIEW,
    update: PERMISSIONS.SERVICES_UPDATE,
    delete: PERMISSIONS.SERVICES_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
