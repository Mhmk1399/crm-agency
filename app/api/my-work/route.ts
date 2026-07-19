import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import {
  buildPermission,
  hasGlobalDashboardAccess,
  hasPermission,
  type AccessResourceId,
} from "@/lib/permissions";
import { getPermissionsForRole } from "@/lib/permission-store";
import { createDataScopeResolver, mergeDataScope, type DataScopeFilter } from "@/lib/data-scope";
import Task from "@/models/Task";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import OperationalExpense from "@/models/OperationalExpense";
import ProjectExpense from "@/models/ProjectExpense";
import User from "@/models/User";
import TeamMemberProfile from "@/models/TeamMemberProfile";
import CompensationProfile from "@/models/CompensationProfile";

const MEMBER_WORK_RESOURCES = new Set<AccessResourceId>([
  "tasks",
  "finance",
  "invoices",
  "payments",
  "operational-expenses",
  "project-expenses",
  "team",
  "users",
  "team-member-profiles",
  "compensation-profiles",
]);

export async function GET() {
  const requestId = generateRequestId();

  try {
    const session = await requireAuth();
    await connectDB();

    const permissions = await getPermissionsForRole(session.role, session.organisationId);
    const globalDashboard = hasGlobalDashboardAccess(session.role);
    const canView = (resource: AccessResourceId) =>
      (globalDashboard || MEMBER_WORK_RESOURCES.has(resource)) &&
      hasPermission(session.role, buildPermission(resource, "view"), permissions);

    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const getDataScope = createDataScopeResolver(session);
    const scope = {
      Task: await getDataScope("Task"),
      Invoice: await getDataScope("Invoice"),
      Payment: await getDataScope("Payment"),
      OperationalExpense: await getDataScope("OperationalExpense"),
      ProjectExpense: await getDataScope("ProjectExpense"),
      User: await getDataScope("User"),
      TeamMemberProfile: await getDataScope("TeamMemberProfile"),
      CompensationProfile: await getDataScope("CompensationProfile"),
    };
    const scoped = (modelName: keyof typeof scope, filter: DataScopeFilter) =>
      mergeDataScope(filter, scope[modelName]);

    const canTasks = canView("tasks");
    const canInvoices = canView("invoices");
    const canPayments = canView("payments");
    const canOperationalExpenses = canView("operational-expenses");
    const canProjectExpenses = canView("project-expenses");
    const canUsers = canView("users");
    const canProfiles = canView("team-member-profiles");
    const canCompensation = canView("compensation-profiles");

    const [
      openTasks,
      overdueTasks,
      dueTodayTasks,
      reviewTasks,
      priorityTasks,
      overdueTaskList,
      invoiceStats,
      overdueInvoiceList,
      recentPayments,
      paymentsThisMonth,
      operationalExpenseTotal,
      projectExpenseTotal,
      users,
      activeUsers,
      profile,
      compensation,
    ] = await Promise.all([
      canTasks ? Task.countDocuments(scoped("Task", { organisationId: orgId, status: { $nin: ["done"] } })) : 0,
      canTasks ? Task.countDocuments(scoped("Task", { organisationId: orgId, status: { $nin: ["done", "backlog"] }, dueDate: { $lt: now } })) : 0,
      canTasks ? Task.countDocuments(scoped("Task", { organisationId: orgId, status: { $nin: ["done"] }, dueDate: { $gte: todayStart, $lt: tomorrowStart } })) : 0,
      canTasks ? Task.countDocuments(scoped("Task", { organisationId: orgId, status: "review" })) : 0,
      canTasks
        ? Task.find(scoped("Task", { organisationId: orgId, status: { $nin: ["done"] } }))
            .select("title status priority dueDate projectId updatedAt")
            .sort({ priority: -1, dueDate: 1, updatedAt: -1 })
            .limit(8)
            .lean()
        : [],
      canTasks
        ? Task.find(scoped("Task", { organisationId: orgId, status: { $nin: ["done", "backlog"] }, dueDate: { $lt: now } }))
            .select("title status priority dueDate")
            .sort({ dueDate: 1 })
            .limit(5)
            .lean()
        : [],
      canInvoices
        ? Invoice.aggregate([
            { $match: scoped("Invoice", { organisationId: orgId }) },
            { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" }, outstanding: { $sum: "$outstandingAmount" } } },
          ])
        : [],
      canInvoices
        ? Invoice.find(scoped("Invoice", { organisationId: orgId, status: "overdue" }))
            .select("invoiceNumber currency total outstandingAmount dueDate")
            .sort({ dueDate: 1 })
            .limit(5)
            .lean()
        : [],
      canPayments
        ? Payment.find(scoped("Payment", { organisationId: orgId }))
            .select("amount currency method reference paidAt")
            .sort({ paidAt: -1, createdAt: -1 })
            .limit(5)
            .lean()
        : [],
      canPayments
        ? Payment.aggregate([
            { $match: scoped("Payment", { organisationId: orgId, paidAt: { $gte: monthStart } }) },
            { $group: { _id: "$currency", total: { $sum: "$amount" }, count: { $sum: 1 } } },
          ])
        : [],
      canOperationalExpenses
        ? OperationalExpense.aggregate([
            { $match: scoped("OperationalExpense", { organisationId: orgId, date: { $gte: monthStart } }) },
            { $group: { _id: "$currency", total: { $sum: "$amount" }, count: { $sum: 1 } } },
          ])
        : [],
      canProjectExpenses
        ? ProjectExpense.aggregate([
            { $match: scoped("ProjectExpense", { organisationId: orgId, date: { $gte: monthStart } }) },
            { $group: { _id: "$currency", total: { $sum: "$amount" }, pending: { $sum: { $cond: ["$isApproved", 0, 1] } }, count: { $sum: 1 } } },
          ])
        : [],
      canUsers ? User.countDocuments(scoped("User", { organisationId: orgId })) : 0,
      canUsers ? User.countDocuments(scoped("User", { organisationId: orgId, isActive: true })) : 0,
      canProfiles
        ? TeamMemberProfile.findOne(scoped("TeamMemberProfile", { organisationId: orgId, isActive: true }))
            .select("title department skills weeklyCapacityHours employmentType startDate")
            .lean()
        : null,
      canCompensation
        ? CompensationProfile.findOne(scoped("CompensationProfile", { organisationId: orgId, isActive: true }))
            .select("fullyLoadedMonthlyCost internalHourlyCost realisticBillableHours effectiveFrom")
            .sort({ effectiveFrom: -1 })
            .lean()
        : null,
    ]);

    const outstandingInvoices = invoiceStats
      .filter((item: { _id: string }) => ["sent", "overdue", "partially_paid"].includes(item._id))
      .reduce((sum: number, item: { outstanding: number }) => sum + item.outstanding, 0);

    return successResponse(
      {
        permissions: {
          tasks: canTasks,
          invoices: canInvoices,
          payments: canPayments,
          operationalExpenses: canOperationalExpenses,
          projectExpenses: canProjectExpenses,
          users: canUsers,
          profiles: canProfiles,
          compensation: canCompensation,
        },
        summary: {
          openTasks,
          overdueTasks,
          dueTodayTasks,
          reviewTasks,
          outstandingInvoices: Math.round(outstandingInvoices),
          overdueInvoices: overdueInvoiceList.length,
          paymentsThisMonth,
          operationalExpenseTotal,
          projectExpenseTotal,
          users,
          activeUsers,
        },
        tasks: {
          priority: priorityTasks,
          overdue: overdueTaskList,
        },
        finance: {
          invoicesByStatus: invoiceStats,
          overdueInvoices: overdueInvoiceList,
          recentPayments,
          paymentsThisMonth,
          operationalExpenseTotal,
          projectExpenseTotal,
        },
        team: {
          profile,
          compensation,
          users,
          activeUsers,
        },
        generatedAt: new Date().toISOString(),
      },
      requestId
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
