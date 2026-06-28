import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ApprovalRequest")).default as any,
  modelName: "ApprovalRequest",

  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
