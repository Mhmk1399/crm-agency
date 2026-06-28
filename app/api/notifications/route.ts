import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Notification")).default as any,
  modelName: "Notification",

  searchFields: ["title"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
