import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Proposal")).default as any,
  modelName: "Proposal",
  permissions: {
    get: PERMISSIONS.PROPOSAL_CREATE,
    update: PERMISSIONS.PROPOSAL_CREATE,
  },
  populateFields: ["leadId", "createdBy"],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
