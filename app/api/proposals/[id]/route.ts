import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Proposal")).default,
  modelName: "Proposal",
  permissions: {
    get: PERMISSIONS.PROPOSALS_VIEW,
    update: PERMISSIONS.PROPOSALS_UPDATE,
  },
  populateFields: ["leadId", "createdBy"],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
