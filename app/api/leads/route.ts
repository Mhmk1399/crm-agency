import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Lead")).default as any,
  modelName: "Lead",
  permissions: {
    list: PERMISSIONS.LEAD_VIEW,
    create: PERMISSIONS.LEAD_CREATE,
  },
  searchFields: ["name", "companyName", "email"],
  populateFields: ["ownerId"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
