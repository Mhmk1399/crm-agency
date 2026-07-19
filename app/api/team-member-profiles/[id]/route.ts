import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/TeamMemberProfile")).default,
  modelName: "TeamMemberProfile",
  permissions: {
    get: PERMISSIONS.TEAM_MEMBER_PROFILES_VIEW,
    update: PERMISSIONS.TEAM_MEMBER_PROFILES_UPDATE,
    delete: PERMISSIONS.TEAM_MEMBER_PROFILES_DELETE,
  },
  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
