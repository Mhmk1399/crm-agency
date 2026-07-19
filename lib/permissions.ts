export const ACTIONS = ["view", "post", "update", "delete"] as const;
export type AccessAction = (typeof ACTIONS)[number];

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

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: ROLES.OWNER, label: "Owner" },
  { value: ROLES.ADMIN, label: "Admin" },
  { value: ROLES.PROJECT_MANAGER, label: "Project Manager" },
  { value: ROLES.DEVELOPER, label: "Developer" },
  { value: ROLES.DESIGNER, label: "Designer" },
  { value: ROLES.SALES, label: "Sales" },
  { value: ROLES.MARKETING, label: "Marketing" },
  { value: ROLES.FINANCE, label: "Finance" },
  { value: ROLES.CLIENT, label: "Client" },
];

export const GLOBAL_DASHBOARD_ROLES: Role[] = [ROLES.OWNER, ROLES.ADMIN];
export const MEMBER_DASHBOARD_TAB_IDS = ["dashboard", "my-work", "tasks", "finance", "team", "profile"] as const;

export function hasGlobalDashboardAccess(role: string): role is typeof GLOBAL_DASHBOARD_ROLES[number] {
  return GLOBAL_DASHBOARD_ROLES.includes(role as Role);
}

export const ACCESS_RESOURCES = [
  { id: "dashboard", label: "Dashboard", group: "Navigation" },
  { id: "leads", label: "Leads", group: "CRM" },
  { id: "clients", label: "Clients", group: "CRM" },
  { id: "proposals", label: "Proposals", group: "CRM" },
  { id: "projects", label: "Projects", group: "Delivery" },
  { id: "tasks", label: "Tasks", group: "Delivery" },
  { id: "project-milestones", label: "Project Milestones", group: "Delivery" },
  { id: "project-members", label: "Project Members", group: "Delivery" },
  { id: "project-expenses", label: "Project Expenses", group: "Finance" },
  { id: "finance", label: "Finance Tab", group: "Finance" },
  { id: "invoices", label: "Invoices", group: "Finance" },
  { id: "payments", label: "Payments", group: "Finance" },
  { id: "operational-expenses", label: "Operational Expenses", group: "Finance" },
  { id: "financial-snapshots", label: "Financial Snapshots", group: "Finance" },
  { id: "team", label: "Team Tab", group: "Team" },
  { id: "users", label: "Users", group: "Team" },
  { id: "team-member-profiles", label: "Member Profiles", group: "Team" },
  { id: "compensation-profiles", label: "Compensation", group: "Team" },
  { id: "settings", label: "Settings", group: "System" },
  { id: "access", label: "Access Manager", group: "System" },
  { id: "reports", label: "Reports", group: "System" },
  { id: "approvals", label: "Approvals", group: "System" },
  { id: "boards", label: "Boards", group: "System" },
  { id: "services", label: "Services", group: "System" },
  { id: "service-packages", label: "Service Packages", group: "System" },
  { id: "notifications", label: "Notifications", group: "System" },
  { id: "task-comments", label: "Task Comments", group: "Tasks" },
  { id: "task-checklists", label: "Task Checklists", group: "Tasks" },
  { id: "task-attachments", label: "Task Attachments", group: "Tasks" },
] as const;

export type AccessResourceId = (typeof ACCESS_RESOURCES)[number]["id"];
export type Permission = `${AccessResourceId}.${AccessAction}`;

export function buildPermission(
  resource: AccessResourceId,
  action: AccessAction
): Permission {
  return `${resource}.${action}` as Permission;
}

export const ALL_PERMISSIONS = ACCESS_RESOURCES.flatMap((resource) =>
  ACTIONS.map((action) => buildPermission(resource.id, action))
);

const resourcePermissions = Object.fromEntries(
  ACCESS_RESOURCES.flatMap((resource) =>
    ACTIONS.map((action) => [
      `${resource.id.toUpperCase().replace(/-/g, "_")}_${action.toUpperCase()}`,
      buildPermission(resource.id, action),
    ])
  )
) as Record<string, Permission>;

export const PERMISSIONS: Record<string, Permission> = {
  ...resourcePermissions,

  ORGANISATION_MANAGE: buildPermission("settings", "update"),
  TEAM_VIEW: buildPermission("team", "view"),
  TEAM_MANAGE: buildPermission("users", "update"),
  SALARY_VIEW: buildPermission("compensation-profiles", "view"),
  SALARY_MANAGE: buildPermission("compensation-profiles", "update"),

  LEAD_CREATE: buildPermission("leads", "post"),
  LEAD_VIEW: buildPermission("leads", "view"),
  LEAD_UPDATE: buildPermission("leads", "update"),
  LEAD_ASSIGN: buildPermission("leads", "update"),
  LEAD_CONVERT: buildPermission("leads", "update"),

  PROPOSAL_CREATE: buildPermission("proposals", "post"),
  PROPOSAL_SEND: buildPermission("proposals", "update"),
  PROPOSAL_APPROVE: buildPermission("proposals", "update"),

  PROJECT_CREATE: buildPermission("projects", "post"),
  PROJECT_VIEW: buildPermission("projects", "view"),
  PROJECT_UPDATE: buildPermission("projects", "update"),
  PROJECT_ARCHIVE: buildPermission("projects", "delete"),
  PROJECT_VIEW_FINANCE: buildPermission("project-expenses", "view"),

  TASK_CREATE: buildPermission("tasks", "post"),
  TASK_VIEW: buildPermission("tasks", "view"),
  TASK_UPDATE: buildPermission("tasks", "update"),
  TASK_ASSIGN: buildPermission("tasks", "update"),
  TASK_REVIEW: buildPermission("tasks", "update"),
  TASK_DELETE: buildPermission("tasks", "delete"),

  TIME_CREATE: buildPermission("tasks", "update"),
  TIME_APPROVE: buildPermission("tasks", "update"),

  FINANCE_VIEW: buildPermission("finance", "view"),
  FINANCE_MANAGE: buildPermission("finance", "update"),
  INVOICE_CREATE: buildPermission("invoices", "post"),
  INVOICE_APPROVE: buildPermission("invoices", "update"),
  PAYMENT_RECORD: buildPermission("payments", "post"),

  CAMPAIGN_CREATE: buildPermission("boards", "post"),
  CAMPAIGN_APPROVE: buildPermission("approvals", "update"),
  CAMPAIGN_PUBLISH: buildPermission("boards", "update"),

  REPORT_VIEW: buildPermission("reports", "view"),
  AUDIT_VIEW: buildPermission("reports", "view"),
} as const;

const P = PERMISSIONS;

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.OWNER]: ALL_PERMISSIONS,
  [ROLES.ADMIN]: ALL_PERMISSIONS.filter((permission) => !permission.startsWith("access.")),
  [ROLES.PROJECT_MANAGER]: [
    P.DASHBOARD_VIEW, P.PROJECTS_VIEW, P.PROJECTS_POST, P.PROJECTS_UPDATE,
    P.TASKS_VIEW, P.TASKS_POST, P.TASKS_UPDATE, P.TASKS_DELETE,
    P.PROJECT_MILESTONES_VIEW, P.PROJECT_MILESTONES_POST, P.PROJECT_MILESTONES_UPDATE,
    P.PROJECT_MEMBERS_VIEW, P.PROJECT_MEMBERS_POST, P.PROJECT_MEMBERS_UPDATE,
    P.TEAM_VIEW, P.USERS_VIEW, P.REPORTS_VIEW,
  ],
  [ROLES.DEVELOPER]: [
    P.DASHBOARD_VIEW, P.PROJECTS_VIEW, P.TASKS_VIEW, P.TASKS_POST, P.TASKS_UPDATE,
    P.TASK_COMMENTS_VIEW, P.TASK_COMMENTS_POST, P.TASK_CHECKLISTS_VIEW, P.TASK_CHECKLISTS_UPDATE,
  ],
  [ROLES.DESIGNER]: [
    P.DASHBOARD_VIEW, P.PROJECTS_VIEW, P.TASKS_VIEW, P.TASKS_POST, P.TASKS_UPDATE,
    P.TASK_COMMENTS_VIEW, P.TASK_COMMENTS_POST,
  ],
  [ROLES.SALES]: [
    P.DASHBOARD_VIEW, P.LEADS_VIEW, P.LEADS_POST, P.LEADS_UPDATE,
    P.CLIENTS_VIEW, P.CLIENTS_POST, P.CLIENTS_UPDATE,
    P.PROPOSALS_VIEW, P.PROPOSALS_POST, P.PROPOSALS_UPDATE,
  ],
  [ROLES.MARKETING]: [
    P.DASHBOARD_VIEW, P.BOARDS_VIEW, P.BOARDS_POST, P.BOARDS_UPDATE,
  ],
  [ROLES.FINANCE]: [
    P.DASHBOARD_VIEW, P.FINANCE_VIEW, P.INVOICES_VIEW, P.INVOICES_POST, P.INVOICES_UPDATE,
    P.PAYMENTS_VIEW, P.PAYMENTS_POST, P.OPERATIONAL_EXPENSES_VIEW, P.OPERATIONAL_EXPENSES_POST,
    P.PROJECT_EXPENSES_VIEW, P.REPORTS_VIEW,
  ],
  [ROLES.CLIENT]: [
    P.DASHBOARD_VIEW, P.PROJECTS_VIEW, P.TASKS_VIEW,
  ],
};

export function isRole(value: string): value is Role {
  return ROLE_OPTIONS.some((role) => role.value === value);
}

export function isPermission(value: string): value is Permission {
  return ALL_PERMISSIONS.includes(value as Permission);
}

export function hasPermission(
  role: Role,
  permission: Permission,
  permissions?: readonly Permission[]
): boolean {
  if (role === ROLES.OWNER) return true;
  return (permissions ?? DEFAULT_ROLE_PERMISSIONS[role] ?? []).includes(permission);
}
