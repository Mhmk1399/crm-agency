import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Service")).default as any,
  modelName: "Service",

  searchFields: ["name", "category"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
