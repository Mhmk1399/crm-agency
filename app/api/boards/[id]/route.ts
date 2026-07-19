import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/Board")).default,
  modelName: "Board",
  permissions: {
    get: PERMISSIONS.BOARDS_VIEW,
    update: PERMISSIONS.BOARDS_UPDATE,
    delete: PERMISSIONS.BOARDS_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
