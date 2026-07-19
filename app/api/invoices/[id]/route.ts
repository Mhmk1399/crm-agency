import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Invoice")).default,
  modelName: "Invoice",
  permissions: {
    get: PERMISSIONS.INVOICES_VIEW,
    update: PERMISSIONS.INVOICES_UPDATE,
  },
  populateFields: ["clientId", "projectId"],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
