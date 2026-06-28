import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/User")).default as any,
  modelName: "User",
  permissions: {
    get: PERMISSIONS.TEAM_VIEW,
    update: PERMISSIONS.TEAM_MANAGE,
    delete: PERMISSIONS.TEAM_MANAGE,
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
