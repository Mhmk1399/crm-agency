import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Invoice")).default,
  modelName: "Invoice",
  permissions: {
    list: PERMISSIONS.INVOICES_VIEW,
    create: PERMISSIONS.INVOICES_POST,
  },
  searchFields: ["invoiceNumber"],
  populateFields: ["clientId", "projectId"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
