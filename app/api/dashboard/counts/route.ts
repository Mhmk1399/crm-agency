import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { requireAuth } from "@/lib/auth";
import {
  PERMISSIONS,
  buildPermission,
  hasGlobalDashboardAccess,
  hasPermission,
  type AccessResourceId,
} from "@/lib/permissions";
import { getPermissionsForRole, requirePermission } from "@/lib/permission-store";
import { createDataScopeResolver, mergeDataScope, type DataScopeFilter } from "@/lib/data-scope";
import ApprovalRequest from "@/models/ApprovalRequest";
import Board from "@/models/Board";
import Client from "@/models/Client";
import CompensationProfile from "@/models/CompensationProfile";
import FinancialSnapshot from "@/models/FinancialSnapshot";
import Invoice from "@/models/Invoice";
import Lead from "@/models/Lead";
import Notification from "@/models/Notification";
import OperationalExpense from "@/models/OperationalExpense";
import Payment from "@/models/Payment";
import Project from "@/models/Project";
import ProjectExpense from "@/models/ProjectExpense";
import ProjectMember from "@/models/ProjectMember";
import ProjectMilestone from "@/models/ProjectMilestone";
import Proposal from "@/models/Proposal";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";
import Task from "@/models/Task";
import TaskAttachment from "@/models/TaskAttachment";
import TaskChecklist from "@/models/TaskChecklist";
import TaskComment from "@/models/TaskComment";
import TeamMemberProfile from "@/models/TeamMemberProfile";
import User from "@/models/User";

export async function GET() {
  const requestId = generateRequestId();

  try {
    const session = await requireAuth();
    await requirePermission({ role: session.role, organisationId: session.organisationId, permission: PERMISSIONS.DASHBOARD_VIEW });
    await connectDB();

    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const now = new Date();
    const getDataScope = createDataScopeResolver(session);
    const permissions = await getPermissionsForRole(session.role, session.organisationId);
    const memberDashboardResources = new Set<AccessResourceId>([
      "tasks",
      "task-attachments",
      "task-checklists",
      "task-comments",
      "finance",
      "invoices",
      "payments",
      "operational-expenses",
      "project-expenses",
      "financial-snapshots",
      "team",
      "users",
      "team-member-profiles",
      "compensation-profiles",
    ]);
    const canView = (resource: AccessResourceId) =>
      (hasGlobalDashboardAccess(session.role) || memberDashboardResources.has(resource)) &&
      hasPermission(session.role, buildPermission(resource, "view"), permissions);
    const zeroUnlessAllowed = (
      resource: AccessResourceId,
      count: PromiseLike<number>
    ) => (canView(resource) ? count : Promise.resolve(0));
    const scopes = Object.fromEntries(
      await Promise.all(
        [
          "ApprovalRequest",
          "Board",
          "Client",
          "CompensationProfile",
          "FinancialSnapshot",
          "Invoice",
          "Lead",
          "Notification",
          "OperationalExpense",
          "Payment",
          "Project",
          "ProjectExpense",
          "ProjectMember",
          "ProjectMilestone",
          "Proposal",
          "Service",
          "ServicePackage",
          "Task",
          "TaskAttachment",
          "TaskChecklist",
          "TaskComment",
          "TeamMemberProfile",
          "User",
        ].map(async (modelName) => [modelName, await getDataScope(modelName)] as const)
      )
    ) as Record<string, DataScopeFilter>;
    const scoped = (modelName: string, filter: DataScopeFilter) =>
      mergeDataScope(filter, scopes[modelName] ?? {});

    const [
      approvals,
      pendingApprovals,
      boards,
      clients,
      compensationProfiles,
      financialSnapshots,
      invoices,
      overdueInvoices,
      leads,
      openLeads,
      notifications,
      unreadNotifications,
      operationalExpenses,
      payments,
      projects,
      activeProjects,
      projectExpenses,
      projectMembers,
      projectMilestones,
      proposals,
      openProposals,
      services,
      servicePackages,
      tasks,
      openTasks,
      overdueTasks,
      taskAttachments,
      taskChecklists,
      taskComments,
      teamMemberProfiles,
      users,
      activeUsers,
    ] = await Promise.all([
      zeroUnlessAllowed("approvals", ApprovalRequest.countDocuments(scoped("ApprovalRequest", { organisationId: orgId }))),
      zeroUnlessAllowed("approvals", ApprovalRequest.countDocuments(scoped("ApprovalRequest", { organisationId: orgId, status: "pending" }))),
      zeroUnlessAllowed("boards", Board.countDocuments(scoped("Board", { organisationId: orgId }))),
      zeroUnlessAllowed("clients", Client.countDocuments(scoped("Client", { organisationId: orgId }))),
      zeroUnlessAllowed("compensation-profiles", CompensationProfile.countDocuments(scoped("CompensationProfile", { organisationId: orgId }))),
      zeroUnlessAllowed("financial-snapshots", FinancialSnapshot.countDocuments(scoped("FinancialSnapshot", { organisationId: orgId }))),
      zeroUnlessAllowed("invoices", Invoice.countDocuments(scoped("Invoice", { organisationId: orgId }))),
      zeroUnlessAllowed("invoices", Invoice.countDocuments(scoped("Invoice", { organisationId: orgId, status: "overdue" }))),
      zeroUnlessAllowed("leads", Lead.countDocuments(scoped("Lead", { organisationId: orgId }))),
      zeroUnlessAllowed("leads", Lead.countDocuments(scoped("Lead", { organisationId: orgId, status: { $nin: ["won", "lost"] } }))),
      zeroUnlessAllowed("notifications", Notification.countDocuments(scoped("Notification", { organisationId: orgId }))),
      zeroUnlessAllowed("notifications", Notification.countDocuments(scoped("Notification", { organisationId: orgId, isRead: false }))),
      zeroUnlessAllowed("operational-expenses", OperationalExpense.countDocuments(scoped("OperationalExpense", { organisationId: orgId }))),
      zeroUnlessAllowed("payments", Payment.countDocuments(scoped("Payment", { organisationId: orgId }))),
      zeroUnlessAllowed("projects", Project.countDocuments(scoped("Project", { organisationId: orgId }))),
      zeroUnlessAllowed("projects", Project.countDocuments(scoped("Project", { organisationId: orgId, status: "active" }))),
      zeroUnlessAllowed("project-expenses", ProjectExpense.countDocuments(scoped("ProjectExpense", { organisationId: orgId }))),
      zeroUnlessAllowed("project-members", ProjectMember.countDocuments(scoped("ProjectMember", { organisationId: orgId }))),
      zeroUnlessAllowed("project-milestones", ProjectMilestone.countDocuments(scoped("ProjectMilestone", { organisationId: orgId }))),
      zeroUnlessAllowed("proposals", Proposal.countDocuments(scoped("Proposal", { organisationId: orgId }))),
      zeroUnlessAllowed("proposals", Proposal.countDocuments(scoped("Proposal", { organisationId: orgId, status: { $in: ["sent", "viewed"] } }))),
      zeroUnlessAllowed("services", Service.countDocuments(scoped("Service", { organisationId: orgId }))),
      zeroUnlessAllowed("service-packages", ServicePackage.countDocuments(scoped("ServicePackage", { organisationId: orgId }))),
      zeroUnlessAllowed("tasks", Task.countDocuments(scoped("Task", { organisationId: orgId }))),
      zeroUnlessAllowed("tasks", Task.countDocuments(scoped("Task", { organisationId: orgId, status: { $nin: ["done"] } }))),
      zeroUnlessAllowed("tasks", Task.countDocuments(scoped("Task", { organisationId: orgId, status: { $nin: ["done", "backlog"] }, dueDate: { $lt: now } }))),
      zeroUnlessAllowed("task-attachments", TaskAttachment.countDocuments(scoped("TaskAttachment", { organisationId: orgId }))),
      zeroUnlessAllowed("task-checklists", TaskChecklist.countDocuments(scoped("TaskChecklist", { organisationId: orgId }))),
      zeroUnlessAllowed("task-comments", TaskComment.countDocuments(scoped("TaskComment", { organisationId: orgId }))),
      zeroUnlessAllowed("team-member-profiles", TeamMemberProfile.countDocuments(scoped("TeamMemberProfile", { organisationId: orgId }))),
      zeroUnlessAllowed("users", User.countDocuments(scoped("User", { organisationId: orgId }))),
      zeroUnlessAllowed("users", User.countDocuments(scoped("User", { organisationId: orgId, isActive: true }))),
    ]);

    const response = successResponse({
      documents: {
        approvals,
        boards,
        clients,
        compensationProfiles,
        financialSnapshots,
        invoices,
        leads,
        notifications,
        operationalExpenses,
        payments,
        projects,
        projectExpenses,
        projectMembers,
        projectMilestones,
        proposals,
        services,
        servicePackages,
        tasks,
        taskAttachments,
        taskChecklists,
        taskComments,
        teamMemberProfiles,
        users,
      },
      highlights: {
        activeProjects,
        activeUsers,
        openLeads,
        openProposals,
        openTasks,
        overdueInvoices,
        overdueTasks,
        pendingApprovals,
        unreadNotifications,
      },
      totals: {
        crm: leads + clients + proposals,
        delivery: projects + tasks + projectMilestones,
        finance: invoices + payments + operationalExpenses + projectExpenses,
        team: users + teamMemberProfiles + compensationProfiles,
        documents:
          approvals +
          boards +
          clients +
          compensationProfiles +
          financialSnapshots +
          invoices +
          leads +
          notifications +
          operationalExpenses +
          payments +
          projects +
          projectExpenses +
          projectMembers +
          projectMilestones +
          proposals +
          services +
          servicePackages +
          tasks +
          taskAttachments +
          taskChecklists +
          taskComments +
          teamMemberProfiles +
          users,
      },
      generatedAt: new Date().toISOString(),
    }, requestId);

    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=300");
    return response;
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
