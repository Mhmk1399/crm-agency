import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Proposal")).default,
  modelName: "Proposal",
  permissions: {
    list: PERMISSIONS.PROPOSALS_VIEW,
    create: PERMISSIONS.PROPOSALS_POST,
  },
  searchFields: ["title", "proposalNumber"],
  populateFields: ["leadId", "createdBy"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
