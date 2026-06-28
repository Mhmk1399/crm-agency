import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError, NotFoundError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import Project from "@/models/Project";
import Task from "@/models/Task";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();

    await connectDB();
    const { id } = await params;
    const orgId = new mongoose.Types.ObjectId(session.organisationId);
    const projectId = new mongoose.Types.ObjectId(id);

    const project = await Project.findOne({ _id: projectId, organisationId: orgId }).lean();
    if (!project) throw new NotFoundError("Project", id);

    const [taskStats, taskCostStats] = await Promise.all([
      Task.aggregate([
        { $match: { organisationId: orgId, projectId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { organisationId: orgId, projectId } },
        { $group: { _id: null, totalMinutes: { $sum: "$actualMinutes" }, totalCost: { $sum: "$actualCost" } } },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    let totalTasks = 0;
    for (const s of taskStats) { statusMap[s._id] = s.count; totalTasks += s.count; }
    const doneTasks = statusMap["done"] ?? 0;
    const blockedTasks = statusMap["blocked"] ?? 0;

    const actualHours = (taskCostStats[0]?.totalMinutes ?? 0) / 60;
    const actualCost = taskCostStats[0]?.totalCost ?? 0;

    const warnings: { type: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

    // Schedule health (25%)
    let scheduleScore = 100;
    if (project.deadline) {
      const now = Date.now();
      const start = project.startDate?.getTime() ?? project.createdAt.getTime();
      const total = project.deadline.getTime() - start;
      const elapsed = now - start;
      const timeProgress = total > 0 ? (elapsed / total) * 100 : 100;
      const taskProgress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
      if (timeProgress > taskProgress + 20) { scheduleScore = 50; warnings.push({ type: "schedule", message: "Behind schedule", severity: "warning" }); }
      if (now > project.deadline.getTime()) { scheduleScore = 20; warnings.push({ type: "schedule", message: "Past deadline", severity: "critical" }); }
    }

    // Budget health (25%)
    let budgetScore = 100;
    if (project.budgetedCost > 0) {
      const budgetUsed = actualCost / project.budgetedCost;
      if (budgetUsed > 1.1) { budgetScore = 20; warnings.push({ type: "budget", message: "Budget exceeded by >10%", severity: "critical" }); }
      else if (budgetUsed > 0.9) { budgetScore = 60; warnings.push({ type: "budget", message: "Budget nearly exhausted", severity: "warning" }); }
    }

    // Task completion (20%)
    const taskScore = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 100;

    // Quality (10%)
    let qualityScore = 100;
    if (blockedTasks > totalTasks * 0.2) { qualityScore = 50; warnings.push({ type: "quality", message: "Too many blocked tasks", severity: "warning" }); }

    // Hours health (10%)
    let hoursScore = 100;
    if (project.estimatedHours > 0 && actualHours > project.estimatedHours * 1.2) {
      hoursScore = 30;
      warnings.push({ type: "hours", message: "Hours exceed estimate by >20%", severity: "warning" });
    }

    // Capacity (10%)
    const capacityScore = 100;

    const score = Math.round(
      scheduleScore * 0.25 + budgetScore * 0.25 + taskScore * 0.20 +
      qualityScore * 0.10 + hoursScore * 0.10 + capacityScore * 0.10
    );

    const status = score >= 85 ? "healthy" : score >= 65 ? "at_risk" : "critical";

    return successResponse({ score, status, warnings, breakdown: { scheduleScore, budgetScore, taskScore, qualityScore, hoursScore, capacityScore } }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
