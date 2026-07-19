import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permission-store";
import { createDataScopeResolver, mergeDataScope } from "@/lib/data-scope";
import * as money from "@/lib/money";
import Invoice from "@/models/Invoice";
import Project from "@/models/Project";
import Task from "@/models/Task";
import ProjectExpense from "@/models/ProjectExpense";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();
    await requirePermission({ role: session.role, organisationId: session.organisationId, permission: PERMISSIONS.FINANCE_VIEW });

    await connectDB();
    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const getDataScope = createDataScopeResolver(session);
    const [invoiceScope, taskScope, expenseScope, projectScope] = await Promise.all([
      getDataScope("Invoice"),
      getDataScope("Task"),
      getDataScope("ProjectExpense"),
      getDataScope("Project"),
    ]);

    const [invoiceStats, labourCosts, expenses, projectProfitability] = await Promise.all([
      Invoice.aggregate([
        { $match: mergeDataScope({ organisationId: orgId }, invoiceScope) },
        { $group: { _id: "$status", totalAmount: { $sum: "$total" }, paidAmount: { $sum: "$paidAmount" }, count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: mergeDataScope({ organisationId: orgId }, taskScope) },
        { $group: { _id: null, totalCost: { $sum: "$actualCost" }, totalMinutes: { $sum: "$actualMinutes" } } },
      ]),
      ProjectExpense.aggregate([
        { $match: mergeDataScope({ organisationId: orgId, isApproved: true }, expenseScope) },
        { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
      ]),
      Project.aggregate([
        { $match: mergeDataScope({ organisationId: orgId, status: { $in: ["active", "completed"] } }, projectScope) },
        { $project: { name: 1, projectCode: 1, contractValue: 1, actualCost: 1, actualProfit: 1, actualMarginPercentage: 1, status: 1 } },
        { $sort: { actualMarginPercentage: 1 } },
        { $limit: 20 },
      ]),
    ]);

    const revenue = invoiceStats.filter((s: { _id: string }) => s._id === "paid").reduce((sum: number, s: { paidAmount: number }) => sum + s.paidAmount, 0);
    const outstanding = invoiceStats.filter((s: { _id: string }) => ["sent", "overdue", "partially_paid"].includes(s._id)).reduce((sum: number, s: { totalAmount: number; paidAmount: number }) => sum + (s.totalAmount - s.paidAmount), 0);
    const overdue = invoiceStats.filter((s: { _id: string }) => s._id === "overdue").reduce((sum: number, s: { totalAmount: number; paidAmount: number }) => sum + (s.totalAmount - s.paidAmount), 0);
    const directCost = (labourCosts[0]?.totalCost ?? 0) + (expenses[0]?.totalExpenses ?? 0);
    const grossProfit = money.grossProfit(revenue, directCost);
    const grossMargin = money.grossMargin(revenue, directCost);

    return successResponse({
      revenue,
      directCost,
      grossProfit,
      grossMarginPercentage: Math.round(grossMargin * 100) / 100,
      outstanding,
      overdue,
      invoicesByStatus: invoiceStats,
      projectProfitability,
      totalLabourHours: Math.round((labourCosts[0]?.totalMinutes ?? 0) / 60),
    }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
