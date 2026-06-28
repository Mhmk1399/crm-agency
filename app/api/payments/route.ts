import { createCrudHandlers } from "@/lib/route-handler";
import { PERMISSIONS } from "@/lib/permissions";

const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Payment")).default as any,
  modelName: "Payment",
  permissions: {
    list: PERMISSIONS.FINANCE_VIEW,
    create: PERMISSIONS.PAYMENT_RECORD,
  },
  searchFields: ["reference"],
  populateFields: [],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
