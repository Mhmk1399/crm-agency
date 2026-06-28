import { AuthorizationError } from "./errors";

export const PERMISSIONS = {
  ORGANISATION_MANAGE: "organisation.manage",
  TEAM_VIEW: "team.view",
  TEAM_MANAGE: "team.manage",
  SALARY_VIEW: "salary.view",
  SALARY_MANAGE: "salary.manage",

  LEAD_CREATE: "lead.create",
  LEAD_VIEW: "lead.view",
  LEAD_UPDATE: "lead.update",
  LEAD_ASSIGN: "lead.assign",
  LEAD_CONVERT: "lead.convert",

  PROPOSAL_CREATE: "proposal.create",
  PROPOSAL_SEND: "proposal.send",
  PROPOSAL_APPROVE: "proposal.approve",

  PROJECT_CREATE: "project.create",
  PROJECT_VIEW: "project.view",
  PROJECT_UPDATE: "project.update",
  PROJECT_ARCHIVE: "project.archive",
  PROJECT_VIEW_FINANCE: "project.view_finance",

  TASK_CREATE: "task.create",
  TASK_ASSIGN: "task.assign",
  TASK_UPDATE: "task.update",
  TASK_REVIEW: "task.review",
  TASK_DELETE: "task.delete",

  TIME_CREATE: "time.create",
  TIME_APPROVE: "time.approve",

  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
  INVOICE_CREATE: "invoice.create",
  INVOICE_APPROVE: "invoice.approve",
  PAYMENT_RECORD: "payment.record",

  CAMPAIGN_CREATE: "campaign.create",
  CAMPAIGN_APPROVE: "campaign.approve",
  CAMPAIGN_PUBLISH: "campaign.publish",

  REPORT_VIEW: "report.view",
  AUDIT_VIEW: "audit.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  PROJECT_MANAGER: "project_manager",
  DEVELOPER: "developer",
  DESIGNER: "designer",
  SALES: "sales",
  MARKETING: "marketing",
  FINANCE: "finance",
  CLIENT: "client",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const P = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    P.ORGANISATION_MANAGE, P.TEAM_VIEW, P.TEAM_MANAGE, P.SALARY_VIEW,
    P.LEAD_CREATE, P.LEAD_VIEW, P.LEAD_UPDATE, P.LEAD_ASSIGN, P.LEAD_CONVERT,
    P.PROPOSAL_CREATE, P.PROPOSAL_SEND, P.PROPOSAL_APPROVE,
    P.PROJECT_CREATE, P.PROJECT_VIEW, P.PROJECT_UPDATE, P.PROJECT_ARCHIVE, P.PROJECT_VIEW_FINANCE,
    P.TASK_CREATE, P.TASK_ASSIGN, P.TASK_UPDATE, P.TASK_REVIEW, P.TASK_DELETE,
    P.TIME_CREATE, P.TIME_APPROVE,
    P.FINANCE_VIEW, P.FINANCE_MANAGE, P.INVOICE_CREATE, P.INVOICE_APPROVE, P.PAYMENT_RECORD,
    P.CAMPAIGN_CREATE, P.CAMPAIGN_APPROVE, P.CAMPAIGN_PUBLISH,
    P.REPORT_VIEW, P.AUDIT_VIEW,
  ],
  [ROLES.PROJECT_MANAGER]: [
    P.TEAM_VIEW,
    P.LEAD_VIEW,
    P.PROPOSAL_CREATE,
    P.PROJECT_CREATE, P.PROJECT_VIEW, P.PROJECT_UPDATE, P.PROJECT_VIEW_FINANCE,
    P.TASK_CREATE, P.TASK_ASSIGN, P.TASK_UPDATE, P.TASK_REVIEW, P.TASK_DELETE,
    P.TIME_CREATE, P.TIME_APPROVE,
    P.REPORT_VIEW,
  ],
  [ROLES.DEVELOPER]: [
    P.PROJECT_VIEW,
    P.TASK_CREATE, P.TASK_UPDATE,
    P.TIME_CREATE,
  ],
  [ROLES.DESIGNER]: [
    P.PROJECT_VIEW,
    P.TASK_CREATE, P.TASK_UPDATE,
    P.TIME_CREATE,
  ],
  [ROLES.SALES]: [
    P.LEAD_CREATE, P.LEAD_VIEW, P.LEAD_UPDATE, P.LEAD_ASSIGN, P.LEAD_CONVERT,
    P.PROPOSAL_CREATE, P.PROPOSAL_SEND,
    P.TIME_CREATE,
  ],
  [ROLES.MARKETING]: [
    P.CAMPAIGN_CREATE, P.CAMPAIGN_PUBLISH,
    P.TIME_CREATE,
  ],
  [ROLES.FINANCE]: [
    P.SALARY_VIEW,
    P.PROJECT_VIEW_FINANCE,
    P.FINANCE_VIEW, P.FINANCE_MANAGE,
    P.INVOICE_CREATE, P.PAYMENT_RECORD,
    P.REPORT_VIEW,
  ],
  [ROLES.CLIENT]: [
    P.PROJECT_VIEW,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(params: {
  role: Role;
  permission: Permission;
}): void {
  if (!hasPermission(params.role, params.permission)) {
    throw new AuthorizationError(
      `Role "${params.role}" lacks permission "${params.permission}"`
    );
  }
}

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
