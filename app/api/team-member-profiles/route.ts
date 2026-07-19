import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/TeamMemberProfile")).default,
  modelName: "TeamMemberProfile",
  permissions: {
    list: PERMISSIONS.TEAM_MEMBER_PROFILES_VIEW,
    create: PERMISSIONS.TEAM_MEMBER_PROFILES_POST,
  },
  searchFields: ["title", "department"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
