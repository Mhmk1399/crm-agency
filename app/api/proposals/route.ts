import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Proposal")).default as any,
  modelName: "Proposal",
  permissions: {
    list: PERMISSIONS.PROPOSAL_CREATE,
    create: PERMISSIONS.PROPOSAL_CREATE,
  },
  searchFields: ["title", "proposalNumber"],
  populateFields: ["leadId", "createdBy"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
