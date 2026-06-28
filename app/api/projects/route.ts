import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Project")).default as any,
  modelName: "Project",
  permissions: {
    list: PERMISSIONS.PROJECT_VIEW,
    create: PERMISSIONS.PROJECT_CREATE,
  },
  searchFields: ["name", "projectCode"],
  populateFields: ["clientId", "projectManagerId"],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
