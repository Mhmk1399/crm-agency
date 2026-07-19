import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { AuthenticationError } from "@/lib/errors";
import { decrypt } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permission-store";
import Organisation from "@/models/Organisation";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();
    await requirePermission({ role: session.role, organisationId: session.organisationId, permission: PERMISSIONS.SETTINGS_VIEW });

    await connectDB();
    const org = await Organisation.findById(session.organisationId).lean();
    if (!org) throw new Error("Organisation not found");

    return successResponse(org, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) throw new AuthenticationError();
    const session = await decrypt(token);
    if (!session) throw new AuthenticationError();
    await requirePermission({ role: session.role, organisationId: session.organisationId, permission: PERMISSIONS.SETTINGS_UPDATE });

    await connectDB();
    const body = await request.json();

    delete body._id;
    delete body.ownerId;
    delete body.slug;

    const org = await Organisation.findByIdAndUpdate(
      new mongoose.Types.ObjectId(session.organisationId),
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!org) throw new Error("Organisation not found");

    return successResponse(org, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
