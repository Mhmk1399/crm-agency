import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError, NotFoundError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import { requirePermission, PERMISSIONS } from "@/lib/permissions";
import { validateTransition } from "@/lib/state-machine";
import { PROPOSAL_TRANSITIONS } from "@/lib/transitions";
import { createAuditLog } from "@/lib/audit";
import Proposal from "@/models/Proposal";
import Project from "@/models/Project";
import Board, { DEFAULT_COLUMNS } from "@/models/Board";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();
    requirePermission({ role: session.role, permission: PERMISSIONS.PROPOSAL_APPROVE });

    await connectDB();
    const { id } = await params;
    const orgId = new mongoose.Types.ObjectId(session.organisationId);

    const proposal = await Proposal.findOne({ _id: new mongoose.Types.ObjectId(id), organisationId: orgId });
    if (!proposal) throw new NotFoundError("Proposal", id);

    validateTransition(PROPOSAL_TRANSITIONS, "Proposal", proposal.status, "accepted");

    proposal.status = "accepted";
    proposal.acceptedAt = new Date();
    await proposal.save();

    const projectCode = `PRJ-${Date.now().toString(36).toUpperCase()}`;
    const totalHours = proposal.items.reduce((sum, item) => sum + item.estimatedHours, 0);

    const project = await Project.create({
      organisationId: orgId,
      clientId: proposal.clientId ?? proposal.leadId,
      proposalId: proposal._id,
      name: proposal.title,
      projectCode,
      ownerId: new mongoose.Types.ObjectId(session.userId),
      projectManagerId: new mongoose.Types.ObjectId(session.userId),
      contractValue: proposal.total,
      budgetedCost: proposal.expectedCost,
      estimatedHours: totalHours,
      expectedProfit: proposal.expectedProfit,
      expectedMarginPercentage: proposal.expectedMarginPercentage,
      status: "planned",
    });

    await Board.create({
      organisationId: orgId,
      projectId: project._id,
      name: "Main Board",
      columns: DEFAULT_COLUMNS,
      isDefault: true,
    });

    await createAuditLog({
      organisationId: session.organisationId,
      actor: session.userId,
      action: "proposal.accepted",
      entityType: "Proposal",
      entityId: id,
      newValue: { projectId: project._id.toString() },
      requestId,
    });

    return successResponse({ proposal: proposal.toObject(), project: project.toObject() }, requestId, 201);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
