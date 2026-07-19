import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Project")).default,
  modelName: "Project",
  permissions: {
    list: PERMISSIONS.PROJECTS_VIEW,
    create: PERMISSIONS.PROJECTS_POST,
  },
  searchFields: ["name", "projectCode"],
  populateFields: ["clientId", "projectManagerId"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
