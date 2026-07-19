import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/User")).default,
  modelName: "User",
  permissions: {
    list: PERMISSIONS.USERS_VIEW,
    create: PERMISSIONS.USERS_POST,
  },
  searchFields: ["name", "email"],
  sensitiveFields: ["passwordHash"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
