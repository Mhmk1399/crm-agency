import { createDetailHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createDetailHandlers({
  model: async () => (await import("@/models/ApprovalRequest")).default as any,
  modelName: "ApprovalRequest",

  populateFields: [],
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
