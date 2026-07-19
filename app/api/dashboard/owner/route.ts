import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import {
  PERMISSIONS,
  buildPermission,
  hasGlobalDashboardAccess,
  hasPermission,
} from "@/lib/permissions";
import { getPermissionsForRole, requirePermission } from "@/lib/permission-store";
import { createDataScopeResolver, mergeDataScope } from "@/lib/data-scope";
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
    await requirePermission({ role: session.role, organisationId: session.organisationId, permission: PERMISSIONS.DASHBOARD_VIEW });

    await connectDB();
    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const getDataScope = createDataScopeResolver(session);
    const permissions = await getPermissionsForRole(session.role, session.organisationId);
    const globalDashboard = hasGlobalDashboardAccess(session.role);
    const canProjects =
      globalDashboard &&
      hasPermission(session.role, buildPermission("projects", "view"), permissions);
    const canLeads =
      globalDashboard &&
      hasPermission(session.role, buildPermission("leads", "view"), permissions);
    const canInvoices = hasPermission(session.role, buildPermission("invoices", "view"), permissions);
    const canTasks = hasPermission(session.role, buildPermission("tasks", "view"), permissions);
    const [projectScope, leadScope, invoiceScope, taskScope] = await Promise.all([
      getDataScope("Project"),
      getDataScope("Lead"),
      getDataScope("Invoice"),
      getDataScope("Task"),
    ]);

    const [
      activeProjects, atRiskProjects, criticalProjects,
      pipelineLeads, invoiceStats,
      overdueTasks, overdueInvoices,
      monthlyRevenue,
    ] = await Promise.all([
      canProjects ? Project.countDocuments(mergeDataScope({ organisationId: orgId, status: "active" }, projectScope)) : 0,
      canProjects ? Project.countDocuments(mergeDataScope({ organisationId: orgId, status: "active", healthScore: { $gte: 65, $lt: 85 } }, projectScope)) : 0,
      canProjects ? Project.countDocuments(mergeDataScope({ organisationId: orgId, status: "active", healthScore: { $lt: 65 } }, projectScope)) : 0,
      canLeads ? Lead.aggregate([
        { $match: mergeDataScope({ organisationId: orgId, status: { $nin: ["won", "lost"] } }, leadScope) },
        { $group: { _id: null, count: { $sum: 1 }, totalValue: { $sum: "$estimatedValue" }, weightedValue: { $sum: { $multiply: ["$estimatedValue", { $divide: ["$probability", 100] }] } } } },
      ]) : [],
      canInvoices ? Invoice.aggregate([
        { $match: mergeDataScope({ organisationId: orgId }, invoiceScope) },
        { $group: { _id: "$status", total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]) : [],
      canTasks ? Task.countDocuments(mergeDataScope({ organisationId: orgId, status: { $nin: ["done", "backlog"] }, dueDate: { $lt: now } }, taskScope)) : 0,
      canInvoices ? Invoice.countDocuments(mergeDataScope({ organisationId: orgId, status: "overdue" }, invoiceScope)) : 0,
      canInvoices ? Invoice.aggregate([
        { $match: mergeDataScope({ organisationId: orgId, status: "paid", paidAt: { $gte: monthStart } }, invoiceScope) },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]) : [],
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
