import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/User")).default as any,
  modelName: "User",
  permissions: {
    list: PERMISSIONS.TEAM_VIEW,
    create: PERMISSIONS.TEAM_MANAGE,
  },
  searchFields: ["name", "email"],
  sensitiveFields: ["passwordHash"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
