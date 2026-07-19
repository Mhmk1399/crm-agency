import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Notification")).default,
  modelName: "Notification",
  permissions: {
    list: PERMISSIONS.NOTIFICATIONS_VIEW,
    create: PERMISSIONS.NOTIFICATIONS_POST,
  },
  searchFields: ["title"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
