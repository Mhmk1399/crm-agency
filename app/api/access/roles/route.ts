import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateRequestId } from "@/lib/correlation";
import { ValidationError } from "@/lib/errors";
import {
  ACCESS_RESOURCES,
  ACTIONS,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  ROLE_OPTIONS,
  ROLES,
  isPermission,
  isRole,
  type Permission,
} from "@/lib/permissions";
import { getPermissionsForRole, requirePermission } from "@/lib/permission-store";
import RolePermission from "@/models/RolePermission";

export async function GET() {
  const requestId = generateRequestId();

  try {
    const session = await requireAuth();
    await requirePermission({
      role: session.role,
      organisationId: session.organisationId,
      permission: PERMISSIONS.ACCESS_VIEW,
    });

    const matrix = await Promise.all(
      ROLE_OPTIONS.map(async (role) => ({
        role: role.value,
        label: role.label,
        locked: role.value === ROLES.OWNER,
        permissions: await getPermissionsForRole(role.value, session.organisationId),
        defaults: DEFAULT_ROLE_PERMISSIONS[role.value] ?? [],
      }))
    );

    return successResponse(
      {
        actions: ACTIONS,
        resources: ACCESS_RESOURCES,
        roles: matrix,
        allPermissions: ALL_PERMISSIONS,
      },
      requestId
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await requireAuth();
    await requirePermission({
      role: session.role,
      organisationId: session.organisationId,
      permission: PERMISSIONS.ACCESS_UPDATE,
    });

    const body = await request.json();
    const role = String(body.role ?? "");
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    if (!isRole(role)) throw new ValidationError("Invalid role");
    if (role === ROLES.OWNER) {
      throw new ValidationError("Owner permissions cannot be changed");
    }

    const uniquePermissions = [...new Set(permissions)]
      .map(String)
      .filter(isPermission) as Permission[];

    if (uniquePermissions.length !== permissions.length) {
      throw new ValidationError("Invalid permission in payload");
    }

    await connectDB();
    const doc = await RolePermission.findOneAndUpdate(
      { organisationId: session.organisationId, role },
      { $set: { permissions: uniquePermissions } },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return successResponse(doc, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
