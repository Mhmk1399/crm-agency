import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Lead")).default,
  modelName: "Lead",
  permissions: {
    list: PERMISSIONS.LEADS_VIEW,
    create: PERMISSIONS.LEADS_POST,
  },
  searchFields: ["name", "companyName", "email"],
  populateFields: ["ownerId"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
