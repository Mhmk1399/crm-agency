import "server-only";

import connectDB from "./db";
import { AuthorizationError } from "./errors";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLES,
  hasPermission,
  isPermission,
  type Permission,
  type Role,
} from "./permissions";
import RolePermission from "@/models/RolePermission";

export async function getPermissionsForRole(
  role: Role,
  organisationId?: string
): Promise<Permission[]> {
  if (role === ROLES.OWNER) return ALL_PERMISSIONS;
  if (!organisationId) return DEFAULT_ROLE_PERMISSIONS[role] ?? [];

  await connectDB();
  const doc = await RolePermission.findOne({ organisationId, role }).lean();
  const permissions = doc?.permissions?.filter(isPermission);
  return permissions && permissions.length > 0
    ? permissions
    : DEFAULT_ROLE_PERMISSIONS[role] ?? [];
}

export async function requirePermission(params: {
  role: Role;
  permission: Permission;
  organisationId?: string;
  permissions?: readonly Permission[];
}): Promise<void> {
  const permissions =
    params.permissions ??
    (await getPermissionsForRole(params.role, params.organisationId));

  if (!hasPermission(params.role, params.permission, permissions)) {
    throw new AuthorizationError(
      `You do not have access to ${params.permission}. Ask an owner to update your role permissions.`
    );
  }
}
