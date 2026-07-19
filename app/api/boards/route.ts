import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Board")).default,
  modelName: "Board",
  permissions: {
    list: PERMISSIONS.BOARDS_VIEW,
    create: PERMISSIONS.BOARDS_POST,
  },
  searchFields: ["name"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
