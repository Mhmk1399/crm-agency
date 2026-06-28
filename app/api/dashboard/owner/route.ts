import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import Project from "@/models/Project";
import Lead from "@/models/Lead";
import Invoice from "@/models/Invoice";
import Task from "@/models/Task";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();

    await connectDB();
    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeProjects, atRiskProjects, criticalProjects,
      pipelineLeads, invoiceStats,
      overdueTasks, overdueInvoices,
      monthlyRevenue,
    ] = await Promise.all([
      Project.countDocuments({ organisationId: orgId, status: "active" }),
      Project.countDocuments({ organisationId: orgId, status: "active", healthScore: { $gte: 65, $lt: 85 } }),
      Project.countDocuments({ organisationId: orgId, status: "active", healthScore: { $lt: 65 } }),
      Lead.aggregate([
        { $match: { organisationId: orgId, status: { $nin: ["won", "lost"] } } },
        { $group: { _id: null, count: { $sum: 1 }, totalValue: { $sum: "$estimatedValue" }, weightedValue: { $sum: { $multiply: ["$estimatedValue", { $divide: ["$probability", 100] }] } } } },
      ]),
      Invoice.aggregate([
        { $match: { organisationId: orgId } },
        { $group: { _id: "$status", total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Task.countDocuments({ organisationId: orgId, status: { $nin: ["done", "backlog"] }, dueDate: { $lt: now } }),
      Invoice.countDocuments({ organisationId: orgId, status: "overdue" }),
      Invoice.aggregate([
        { $match: { organisationId: orgId, status: "paid", paidAt: { $gte: monthStart } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),
    ]);

    const pipeline = pipelineLeads[0] ?? { count: 0, totalValue: 0, weightedValue: 0 };
    const outstanding = invoiceStats.filter((s: { _id: string }) => ["sent", "overdue", "partially_paid"].includes(s._id)).reduce((sum: number, s: { total: number }) => sum + s.total, 0);

    return successResponse({
      activeProjects,
      atRiskProjects,
      criticalProjects,
      pipelineLeadCount: pipeline.count,
      pipelineValue: Math.round(pipeline.totalValue),
      weightedPipelineValue: Math.round(pipeline.weightedValue),
      monthlyRevenue: monthlyRevenue[0]?.revenue ?? 0,
      outstandingInvoices: Math.round(outstanding),
      overdueTasks,
      overdueInvoices,
    }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
