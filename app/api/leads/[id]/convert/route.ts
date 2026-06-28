import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError, NotFoundError, ConflictError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import { requirePermission, PERMISSIONS } from "@/lib/permissions";
import { validateTransition } from "@/lib/state-machine";
import { LEAD_TRANSITIONS } from "@/lib/transitions";
import { createAuditLog } from "@/lib/audit";
import Lead from "@/models/Lead";
import Client from "@/models/Client";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();
    requirePermission({ role: session.role, permission: PERMISSIONS.LEAD_CONVERT });

    await connectDB();
    const { id } = await params;
    const orgId = new mongoose.Types.ObjectId(session.organisationId);

    const lead = await Lead.findOne({ _id: new mongoose.Types.ObjectId(id), organisationId: orgId });
    if (!lead) throw new NotFoundError("Lead", id);

    validateTransition(LEAD_TRANSITIONS, "Lead", lead.status, "won");

    const existingClient = await Client.findOne({ organisationId: orgId, email: lead.email });
    if (existingClient) throw new ConflictError("Client with this email already exists");

    const client = await Client.create({
      organisationId: orgId,
      leadId: lead._id,
      name: lead.name,
      companyName: lead.companyName,
      email: lead.email,
      phoneNumber: lead.phoneNumber,
      website: lead.website,
      contactPerson: lead.name,
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });

    lead.status = "won";
    await lead.save();

    await createAuditLog({
      organisationId: session.organisationId,
      actor: session.userId,
      action: "lead.converted",
      entityType: "Lead",
      entityId: id,
      newValue: { clientId: client._id.toString() },
      requestId,
    });

    return successResponse({ lead: lead.toObject(), client: client.toObject() }, requestId, 201);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
