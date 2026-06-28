import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Lead")).default as any,
  modelName: "Lead",
  permissions: {
    get: PERMISSIONS.LEAD_VIEW,
    update: PERMISSIONS.LEAD_UPDATE,
  },
  populateFields: ["ownerId"],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
