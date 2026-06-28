import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ProjectMember")).default as any,
  modelName: "ProjectMember",
  permissions: {
    list: PERMISSIONS.PROJECT_VIEW,
    create: PERMISSIONS.PROJECT_UPDATE,
  },
  searchFields: [],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
