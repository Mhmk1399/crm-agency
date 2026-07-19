import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Client")).default,
  modelName: "Client",
  permissions: {
    get: PERMISSIONS.CLIENTS_VIEW,
    update: PERMISSIONS.CLIENTS_UPDATE,
    delete: PERMISSIONS.CLIENTS_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
