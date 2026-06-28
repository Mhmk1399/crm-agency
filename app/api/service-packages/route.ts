import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/ServicePackage")).default as any,
  modelName: "ServicePackage",

  searchFields: ["name"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
