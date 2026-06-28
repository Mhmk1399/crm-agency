import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError, NotFoundError } from "@/lib/errors";
import { requirePermission, PERMISSIONS } from "@/lib/permissions";
import { decrypt } from "@/lib/auth";
import * as money from "@/lib/money";
import Project from "@/models/Project";
import Task from "@/models/Task";
import ProjectExpense from "@/models/ProjectExpense";
import Invoice from "@/models/Invoice";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();
    requirePermission({ role: session.role, permission: PERMISSIONS.PROJECT_VIEW_FINANCE });

    await connectDB();
    const { id } = await params;
    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const projectId = new mongoose.Types.ObjectId(id);

    const project = await Project.findOne({ _id: projectId, organisationId: orgId }).lean();
    if (!project) throw new NotFoundError("Project", id);

    const [taskStats, expenses, invoices] = await Promise.all([
      Task.aggregate([
        { $match: { organisationId: orgId, projectId } },
        { $group: { _id: null, totalMinutes: { $sum: "$actualMinutes" }, totalCost: { $sum: "$actualCost" }, billableMinutes: { $sum: { $cond: ["$isBillable", "$actualMinutes", 0] } } } },
      ]),
      ProjectExpense.aggregate([
        { $match: { organisationId: orgId, projectId, isApproved: true } },
        { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
      ]),
      Invoice.aggregate([
        { $match: { organisationId: orgId, projectId } },
        { $group: { _id: null, invoiced: { $sum: "$total" }, paid: { $sum: "$paidAmount" }, outstanding: { $sum: "$outstandingAmount" } } },
      ]),
    ]);

    const labourCost = taskStats[0]?.totalCost ?? 0;
    const expenseCost = expenses[0]?.totalExpenses ?? 0;
    const totalCost = money.add(labourCost, expenseCost);
    const actualProfit = money.subtract(project.contractValue, totalCost);
    const actualMargin = money.grossMargin(project.contractValue, totalCost);

    return successResponse({
      contractValue: project.contractValue,
      budgetedCost: project.budgetedCost,
      estimatedHours: project.estimatedHours,
      actualHours: Math.round((taskStats[0]?.totalMinutes ?? 0) / 60 * 10) / 10,
      billableHours: Math.round((taskStats[0]?.billableMinutes ?? 0) / 60 * 10) / 10,
      labourCost,
      expenseCost,
      totalCost,
      expectedProfit: project.expectedProfit,
      actualProfit,
      expectedMarginPercentage: project.expectedMarginPercentage,
      actualMarginPercentage: Math.round(actualMargin * 100) / 100,
      invoiced: invoices[0]?.invoiced ?? 0,
      paid: invoices[0]?.paid ?? 0,
      outstanding: invoices[0]?.outstanding ?? 0,
      budgetUsedPercentage: project.budgetedCost > 0 ? Math.round((totalCost / project.budgetedCost) * 10000) / 100 : 0,
      hoursUsedPercentage: project.estimatedHours > 0 ? Math.round(((taskStats[0]?.totalMinutes ?? 0) / 60 / project.estimatedHours) * 10000) / 100 : 0,
    }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
