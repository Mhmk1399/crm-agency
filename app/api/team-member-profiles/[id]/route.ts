import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/TeamMemberProfile")).default as any,
  modelName: "TeamMemberProfile",
  permissions: {
    get: PERMISSIONS.TEAM_VIEW,
    update: PERMISSIONS.TEAM_MANAGE,
    delete: PERMISSIONS.TEAM_MANAGE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
