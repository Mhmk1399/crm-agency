import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ProjectMilestone")).default,
  modelName: "ProjectMilestone",
  permissions: {
    list: PERMISSIONS.PROJECT_MILESTONES_VIEW,
    create: PERMISSIONS.PROJECT_MILESTONES_POST,
  },
  searchFields: ["title"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
