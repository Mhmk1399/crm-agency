import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Invoice")).default as any,
  modelName: "Invoice",
  permissions: {
    get: PERMISSIONS.FINANCE_VIEW,
    update: PERMISSIONS.FINANCE_MANAGE,
  },
  populateFields: ["clientId", "projectId"],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
