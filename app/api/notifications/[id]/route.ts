import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Notification")).default,
  modelName: "Notification",
  permissions: {
    get: PERMISSIONS.NOTIFICATIONS_VIEW,
    update: PERMISSIONS.NOTIFICATIONS_UPDATE,
    delete: PERMISSIONS.NOTIFICATIONS_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
