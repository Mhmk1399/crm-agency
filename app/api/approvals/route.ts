import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ApprovalRequest")).default,
  modelName: "ApprovalRequest",
  permissions: {
    list: PERMISSIONS.APPROVALS_VIEW,
    create: PERMISSIONS.APPROVALS_POST,
  },
  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
