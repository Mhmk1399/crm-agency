import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Client")).default,
  modelName: "Client",
  permissions: {
    list: PERMISSIONS.CLIENTS_VIEW,
    create: PERMISSIONS.CLIENTS_POST,
  },
  searchFields: ["name", "companyName", "email"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
