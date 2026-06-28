import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ProjectMilestone")).default as any,
  modelName: "ProjectMilestone",
  permissions: {
    list: PERMISSIONS.PROJECT_VIEW,
    create: PERMISSIONS.PROJECT_UPDATE,
  },
  searchFields: ["title"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
