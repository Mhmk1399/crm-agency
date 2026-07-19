import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/CompensationProfile")).default,
  modelName: "CompensationProfile",
  permissions: {
    get: PERMISSIONS.COMPENSATION_PROFILES_VIEW,
    update: PERMISSIONS.COMPENSATION_PROFILES_UPDATE,
    delete: PERMISSIONS.COMPENSATION_PROFILES_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
