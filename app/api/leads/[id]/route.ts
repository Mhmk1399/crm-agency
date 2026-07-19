import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Lead")).default,
  modelName: "Lead",
  permissions: {
    get: PERMISSIONS.LEADS_VIEW,
    update: PERMISSIONS.LEADS_UPDATE,
  },
  populateFields: ["ownerId"],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
