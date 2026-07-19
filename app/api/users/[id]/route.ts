import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/User")).default,
  modelName: "User",
  permissions: {
    get: PERMISSIONS.USERS_VIEW,
    update: PERMISSIONS.USERS_UPDATE,
    delete: PERMISSIONS.USERS_DELETE,
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
