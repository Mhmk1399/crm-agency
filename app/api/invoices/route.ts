import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Invoice")).default as any,
  modelName: "Invoice",
  permissions: {
    list: PERMISSIONS.FINANCE_VIEW,
    create: PERMISSIONS.INVOICE_CREATE,
  },
  searchFields: ["invoiceNumber"],
  populateFields: ["clientId", "projectId"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
