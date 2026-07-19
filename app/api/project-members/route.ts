import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ProjectMember")).default,
  modelName: "ProjectMember",
  permissions: {
    list: PERMISSIONS.PROJECT_MEMBERS_VIEW,
    create: PERMISSIONS.PROJECT_MEMBERS_POST,
  },
  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
