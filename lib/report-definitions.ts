import { buildPermission, type AccessResourceId, type Permission } from "./permissions";

export type ReportFieldType = "text" | "number" | "date" | "select" | "boolean" | "currency";

export interface ReportOption {
  label: string;
  value: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  type?: ReportFieldType;
}

export interface ReportFilter {
  key: string;
  label: string;
  type: "select" | "boolean";
  options?: ReportOption[];
}

export interface ReportResource {
  id: AccessResourceId;
  label: string;
  description: string;
  permission: Permission;
  searchFields: string[];
  dateFields: ReportOption[];
  filters: ReportFilter[];
  columns: ReportColumn[];
  numericFields: ReportOption[];
  defaultSort: string;
}

const leadSources: ReportOption[] = [
  { label: "Website", value: "website" },
  { label: "Referral", value: "referral" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Cold Outreach", value: "cold_outreach" },
  { label: "Event", value: "event" },
  { label: "Advertisement", value: "advertisement" },
  { label: "Other", value: "other" },
];

const currencies: ReportOption[] = [
  { label: "IRR", value: "IRR" },
  { label: "USD", value: "USD" },
  { label: "GBP", value: "GBP" },
];

export const REPORT_RESOURCES: ReportResource[] = [
  {
    id: "leads",
    label: "Leads",
    description: "Pipeline, lead source, probability, and follow-up reports",
    permission: buildPermission("leads", "view"),
    searchFields: ["name", "companyName", "email", "phoneNumber"],
    dateFields: [
      { label: "Created", value: "createdAt" },
      { label: "Expected Close", value: "expectedCloseDate" },
      { label: "Next Follow-up", value: "nextFollowUpAt" },
      { label: "Updated", value: "updatedAt" },
    ],
    filters: [
      { key: "status", label: "Status", type: "select", options: ["new", "contacted", "qualified", "proposal_sent", "negotiation", "won", "lost"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) },
      { key: "source", label: "Source", type: "select", options: leadSources },
    ],
    columns: [
      { key: "name", label: "Contact" },
      { key: "companyName", label: "Company" },
      { key: "status", label: "Status", type: "select" },
      { key: "source", label: "Source", type: "select" },
      { key: "estimatedValue", label: "Value", type: "currency" },
      { key: "probability", label: "Probability", type: "number" },
      { key: "expectedCloseDate", label: "Expected Close", type: "date" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    numericFields: [{ label: "Estimated Value", value: "estimatedValue" }, { label: "Probability", value: "probability" }],
    defaultSort: "createdAt",
  },
  {
    id: "clients",
    label: "Clients",
    description: "Client status, source, and activity reports",
    permission: buildPermission("clients", "view"),
    searchFields: ["name", "companyName", "email", "contactPerson"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Updated", value: "updatedAt" }],
    filters: [
      { key: "isActive", label: "Status", type: "boolean", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
      { key: "source", label: "Source", type: "select", options: leadSources },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "companyName", label: "Company" },
      { key: "email", label: "Email" },
      { key: "source", label: "Source", type: "select" },
      { key: "isActive", label: "Active", type: "boolean" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    numericFields: [],
    defaultSort: "createdAt",
  },
  {
    id: "proposals",
    label: "Proposals",
    description: "Quote value, margin, acceptance, and validity reports",
    permission: buildPermission("proposals", "view"),
    searchFields: ["title", "proposalNumber", "description"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Valid Until", value: "validUntil" }, { label: "Accepted", value: "acceptedAt" }, { label: "Sent", value: "sentAt" }],
    filters: [{ key: "status", label: "Status", type: "select", options: ["draft", "sent", "viewed", "accepted", "rejected", "expired", "cancelled"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) }],
    columns: [
      { key: "proposalNumber", label: "#" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status", type: "select" },
      { key: "total", label: "Total", type: "currency" },
      { key: "expectedProfit", label: "Profit", type: "currency" },
      { key: "expectedMarginPercentage", label: "Margin", type: "number" },
      { key: "validUntil", label: "Valid Until", type: "date" },
    ],
    numericFields: [{ label: "Total", value: "total" }, { label: "Expected Cost", value: "expectedCost" }, { label: "Expected Profit", value: "expectedProfit" }],
    defaultSort: "createdAt",
  },
  {
    id: "projects",
    label: "Projects",
    description: "Delivery, risk, profitability, and health reports",
    permission: buildPermission("projects", "view"),
    searchFields: ["name", "projectCode", "description"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Start", value: "startDate" }, { label: "Deadline", value: "deadline" }, { label: "Completed", value: "completedAt" }],
    filters: [
      { key: "status", label: "Status", type: "select", options: ["planned", "active", "on_hold", "client_review", "completed", "cancelled"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) },
      { key: "riskLevel", label: "Risk", type: "select", options: ["low", "medium", "high", "critical"].map((v) => ({ label: v, value: v })) },
    ],
    columns: [
      { key: "projectCode", label: "Code" },
      { key: "name", label: "Name" },
      { key: "status", label: "Status", type: "select" },
      { key: "riskLevel", label: "Risk", type: "select" },
      { key: "contractValue", label: "Contract", type: "currency" },
      { key: "actualProfit", label: "Profit", type: "currency" },
      { key: "healthScore", label: "Health", type: "number" },
      { key: "deadline", label: "Deadline", type: "date" },
    ],
    numericFields: ["contractValue", "budgetedCost", "expectedProfit", "actualCost", "actualProfit", "healthScore", "progressPercentage"].map((v) => ({ label: v.replace(/([A-Z])/g, " $1"), value: v })),
    defaultSort: "createdAt",
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Task status, effort, cost, billable work, and deadlines",
    permission: buildPermission("tasks", "view"),
    searchFields: ["title", "description", "blockedReason"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Start", value: "startDate" }, { label: "Due", value: "dueDate" }, { label: "Completed", value: "completedAt" }],
    filters: [
      { key: "status", label: "Status", type: "select", options: ["backlog", "todo", "in_progress", "review", "blocked", "done"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) },
      { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high", "urgent"].map((v) => ({ label: v, value: v })) },
      { key: "type", label: "Type", type: "select", options: ["original_scope", "bug", "client_revision", "paid_change_request", "internal_rework", "marketing", "sales", "administrative", "support"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) },
      { key: "isBillable", label: "Billable", type: "boolean", options: [{ label: "Billable", value: "true" }, { label: "Non-billable", value: "false" }] },
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "status", label: "Status", type: "select" },
      { key: "priority", label: "Priority", type: "select" },
      { key: "type", label: "Type", type: "select" },
      { key: "estimatedMinutes", label: "Estimated", type: "number" },
      { key: "actualMinutes", label: "Actual", type: "number" },
      { key: "dueDate", label: "Due", type: "date" },
    ],
    numericFields: ["complexityPoints", "estimatedMinutes", "actualMinutes", "estimatedCost", "actualCost", "billableValue"].map((v) => ({ label: v.replace(/([A-Z])/g, " $1"), value: v })),
    defaultSort: "createdAt",
  },
  {
    id: "invoices",
    label: "Invoices",
    description: "Invoice totals, paid amounts, outstanding balances, and due dates",
    permission: buildPermission("invoices", "view"),
    searchFields: ["invoiceNumber", "notes"],
    dateFields: [{ label: "Issued", value: "issuedDate" }, { label: "Due", value: "dueDate" }, { label: "Paid", value: "paidAt" }, { label: "Created", value: "createdAt" }],
    filters: [
      { key: "status", label: "Status", type: "select", options: ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) },
      { key: "currency", label: "Currency", type: "select", options: currencies },
    ],
    columns: [
      { key: "invoiceNumber", label: "#" },
      { key: "status", label: "Status", type: "select" },
      { key: "currency", label: "Currency" },
      { key: "total", label: "Total", type: "currency" },
      { key: "paidAmount", label: "Paid", type: "currency" },
      { key: "outstandingAmount", label: "Outstanding", type: "currency" },
      { key: "dueDate", label: "Due", type: "date" },
    ],
    numericFields: ["subtotal", "discount", "tax", "total", "paidAmount", "outstandingAmount"].map((v) => ({ label: v.replace(/([A-Z])/g, " $1"), value: v })),
    defaultSort: "issuedDate",
  },
  {
    id: "payments",
    label: "Payments",
    description: "Payment collection by method, currency, and date",
    permission: buildPermission("payments", "view"),
    searchFields: ["method", "reference", "notes"],
    dateFields: [{ label: "Paid", value: "paidAt" }, { label: "Created", value: "createdAt" }],
    filters: [{ key: "currency", label: "Currency", type: "select", options: currencies }],
    columns: [
      { key: "currency", label: "Currency" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "method", label: "Method" },
      { key: "reference", label: "Reference" },
      { key: "paidAt", label: "Paid", type: "date" },
    ],
    numericFields: [{ label: "Amount", value: "amount" }],
    defaultSort: "paidAt",
  },
  {
    id: "operational-expenses",
    label: "Operational Expenses",
    description: "Overhead spending by category, currency, and date",
    permission: buildPermission("operational-expenses", "view"),
    searchFields: ["description", "category", "notes"],
    dateFields: [{ label: "Date", value: "date" }, { label: "Created", value: "createdAt" }],
    filters: [
      { key: "category", label: "Category", type: "select", options: ["rent", "electricity", "internet", "salary", "insurance", "software_subscription", "equipment", "office_supplies", "tax", "other"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) },
      { key: "currency", label: "Currency", type: "select", options: currencies },
    ],
    columns: [
      { key: "description", label: "Description" },
      { key: "category", label: "Category" },
      { key: "currency", label: "Currency" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "date", label: "Date", type: "date" },
    ],
    numericFields: [{ label: "Amount", value: "amount" }],
    defaultSort: "date",
  },
  {
    id: "project-expenses",
    label: "Project Expenses",
    description: "Project costs, approvals, categories, and spend dates",
    permission: buildPermission("project-expenses", "view"),
    searchFields: ["description", "category"],
    dateFields: [{ label: "Date", value: "date" }, { label: "Created", value: "createdAt" }],
    filters: [
      { key: "isApproved", label: "Approval", type: "boolean", options: [{ label: "Approved", value: "true" }, { label: "Pending", value: "false" }] },
      { key: "currency", label: "Currency", type: "select", options: currencies },
    ],
    columns: [
      { key: "description", label: "Description" },
      { key: "category", label: "Category" },
      { key: "currency", label: "Currency" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "isApproved", label: "Approved", type: "boolean" },
      { key: "date", label: "Date", type: "date" },
    ],
    numericFields: [{ label: "Amount", value: "amount" }],
    defaultSort: "date",
  },
  {
    id: "users",
    label: "Users",
    description: "Team users, roles, activation, and login activity",
    permission: buildPermission("users", "view"),
    searchFields: ["name", "email", "role"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Last Login", value: "lastLoginAt" }, { label: "Updated", value: "updatedAt" }],
    filters: [
      { key: "role", label: "Role", type: "select", options: ["owner", "admin", "project_manager", "developer", "designer", "sales", "marketing", "finance", "client"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) },
      { key: "isActive", label: "Status", type: "boolean", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "isActive", label: "Active", type: "boolean" },
      { key: "lastLoginAt", label: "Last Login", type: "date" },
    ],
    numericFields: [],
    defaultSort: "createdAt",
  },
  {
    id: "team-member-profiles",
    label: "Member Profiles",
    description: "Departments, employment types, capacity, and active profile reports",
    permission: buildPermission("team-member-profiles", "view"),
    searchFields: ["title", "department", "employmentType"],
    dateFields: [{ label: "Start", value: "startDate" }, { label: "End", value: "endDate" }, { label: "Created", value: "createdAt" }],
    filters: [
      { key: "department", label: "Department", type: "select", options: ["engineering", "design", "product", "sales", "marketing", "operations", "finance", "hr"].map((v) => ({ label: v, value: v })) },
      { key: "employmentType", label: "Employment", type: "select", options: ["full_time", "part_time", "contractor"].map((v) => ({ label: v.replace(/_/g, " "), value: v })) },
      { key: "isActive", label: "Status", type: "boolean", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "department", label: "Department" },
      { key: "employmentType", label: "Employment" },
      { key: "weeklyCapacityHours", label: "Weekly Capacity", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
      { key: "startDate", label: "Start", type: "date" },
    ],
    numericFields: [{ label: "Weekly Capacity", value: "weeklyCapacityHours" }],
    defaultSort: "createdAt",
  },
  {
    id: "compensation-profiles",
    label: "Compensation",
    description: "Salary, loaded cost, billable hours, and internal hourly cost reports",
    permission: buildPermission("compensation-profiles", "view"),
    searchFields: [],
    dateFields: [{ label: "Effective From", value: "effectiveFrom" }, { label: "Effective To", value: "effectiveTo" }, { label: "Created", value: "createdAt" }],
    filters: [{ key: "isActive", label: "Status", type: "boolean", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] }],
    columns: [
      { key: "salary", label: "Salary", type: "currency" },
      { key: "fullyLoadedMonthlyCost", label: "Loaded Cost", type: "currency" },
      { key: "realisticBillableHours", label: "Billable Hours", type: "number" },
      { key: "internalHourlyCost", label: "Hourly Cost", type: "currency" },
      { key: "isActive", label: "Active", type: "boolean" },
      { key: "effectiveFrom", label: "Effective From", type: "date" },
    ],
    numericFields: ["salary", "employerCosts", "fullyLoadedMonthlyCost", "realisticBillableHours", "internalHourlyCost"].map((v) => ({ label: v.replace(/([A-Z])/g, " $1"), value: v })),
    defaultSort: "effectiveFrom",
  },
  {
    id: "project-milestones",
    label: "Project Milestones",
    description: "Milestone due dates, completion, order, and invoice triggers",
    permission: buildPermission("project-milestones", "view"),
    searchFields: ["title", "description"],
    dateFields: [{ label: "Due", value: "dueDate" }, { label: "Completed", value: "completedAt" }, { label: "Created", value: "createdAt" }],
    filters: [
      { key: "isCompleted", label: "Completion", type: "boolean", options: [{ label: "Completed", value: "true" }, { label: "Open", value: "false" }] },
      { key: "invoiceOnCompletion", label: "Invoice Trigger", type: "boolean", options: [{ label: "Invoice", value: "true" }, { label: "No invoice", value: "false" }] },
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "isCompleted", label: "Completed", type: "boolean" },
      { key: "invoiceOnCompletion", label: "Invoice", type: "boolean" },
      { key: "invoiceAmount", label: "Invoice Amount", type: "currency" },
      { key: "dueDate", label: "Due", type: "date" },
    ],
    numericFields: [{ label: "Invoice Amount", value: "invoiceAmount" }, { label: "Order", value: "order" }],
    defaultSort: "dueDate",
  },
  {
    id: "project-members",
    label: "Project Members",
    description: "Allocation, billing rates, hourly cost, and active memberships",
    permission: buildPermission("project-members", "view"),
    searchFields: ["role"],
    dateFields: [{ label: "Joined", value: "joinedAt" }, { label: "Left", value: "leftAt" }, { label: "Created", value: "createdAt" }],
    filters: [{ key: "isActive", label: "Status", type: "boolean", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] }],
    columns: [
      { key: "role", label: "Role" },
      { key: "allocatedHours", label: "Allocated", type: "number" },
      { key: "billingRateSnapshot", label: "Billing Rate", type: "currency" },
      { key: "hourlyCostSnapshot", label: "Hourly Cost", type: "currency" },
      { key: "isActive", label: "Active", type: "boolean" },
      { key: "joinedAt", label: "Joined", type: "date" },
    ],
    numericFields: ["allocatedHours", "billingRateSnapshot", "hourlyCostSnapshot"].map((v) => ({ label: v.replace(/([A-Z])/g, " $1"), value: v })),
    defaultSort: "joinedAt",
  },
  {
    id: "financial-snapshots",
    label: "Financial Snapshots",
    description: "Historical revenue, cost, profit, margin, and outstanding reports",
    permission: buildPermission("financial-snapshots", "view"),
    searchFields: ["period", "type"],
    dateFields: [{ label: "Snapshot", value: "snapshotDate" }, { label: "Created", value: "createdAt" }],
    filters: [{ key: "type", label: "Type", type: "select", options: ["monthly", "project", "quarterly", "yearly"].map((v) => ({ label: v, value: v })) }],
    columns: [
      { key: "period", label: "Period" },
      { key: "type", label: "Type" },
      { key: "revenue", label: "Revenue", type: "currency" },
      { key: "directCost", label: "Direct Cost", type: "currency" },
      { key: "netProfit", label: "Net Profit", type: "currency" },
      { key: "snapshotDate", label: "Snapshot", type: "date" },
    ],
    numericFields: ["revenue", "directCost", "grossProfit", "overhead", "netProfit", "invoicedAmount", "paidAmount", "outstandingAmount"].map((v) => ({ label: v.replace(/([A-Z])/g, " $1"), value: v })),
    defaultSort: "snapshotDate",
  },
  {
    id: "services",
    label: "Services",
    description: "Service pricing, estimates, revisions, margins, and delivery settings",
    permission: buildPermission("services", "view"),
    searchFields: ["name", "slug", "category", "description"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Updated", value: "updatedAt" }],
    filters: [
      { key: "pricingType", label: "Pricing", type: "select", options: ["fixed", "hourly", "retainer", "milestone"].map((v) => ({ label: v, value: v })) },
      { key: "isActive", label: "Status", type: "boolean", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "pricingType", label: "Pricing" },
      { key: "standardPrice", label: "Standard", type: "currency" },
      { key: "targetMarginPercentage", label: "Margin", type: "number" },
      { key: "deliveryDays", label: "Delivery Days", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    numericFields: ["minimumPrice", "standardPrice", "estimatedMinHours", "estimatedMaxHours", "targetMarginPercentage", "deliveryDays"].map((v) => ({ label: v.replace(/([A-Z])/g, " $1"), value: v })),
    defaultSort: "createdAt",
  },
  {
    id: "service-packages",
    label: "Service Packages",
    description: "Package tier, price, estimated hours, delivery, and revisions",
    permission: buildPermission("service-packages", "view"),
    searchFields: ["name", "tier", "description"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Updated", value: "updatedAt" }],
    filters: [
      { key: "tier", label: "Tier", type: "select", options: ["basic", "standard", "premium", "custom"].map((v) => ({ label: v, value: v })) },
      { key: "isActive", label: "Status", type: "boolean", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "tier", label: "Tier" },
      { key: "price", label: "Price", type: "currency" },
      { key: "estimatedHours", label: "Hours", type: "number" },
      { key: "deliveryDays", label: "Delivery Days", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    numericFields: ["price", "estimatedHours", "deliveryDays", "includedRevisions"].map((v) => ({ label: v.replace(/([A-Z])/g, " $1"), value: v })),
    defaultSort: "createdAt",
  },
  {
    id: "boards",
    label: "Boards",
    description: "Project boards and default board configuration",
    permission: buildPermission("boards", "view"),
    searchFields: ["name"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Updated", value: "updatedAt" }],
    filters: [{ key: "isDefault", label: "Default", type: "boolean", options: [{ label: "Default", value: "true" }, { label: "Custom", value: "false" }] }],
    columns: [
      { key: "name", label: "Name" },
      { key: "isDefault", label: "Default", type: "boolean" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    numericFields: [],
    defaultSort: "createdAt",
  },
  {
    id: "approvals",
    label: "Approvals",
    description: "Approval queue status, decisions, and decision dates",
    permission: buildPermission("approvals", "view"),
    searchFields: ["entityType", "decision", "notes"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Decided", value: "decidedAt" }, { label: "Updated", value: "updatedAt" }],
    filters: [{ key: "status", label: "Status", type: "select", options: ["pending", "approved", "rejected"].map((v) => ({ label: v, value: v })) }],
    columns: [
      { key: "entityType", label: "Entity" },
      { key: "status", label: "Status" },
      { key: "decision", label: "Decision" },
      { key: "decidedAt", label: "Decided", type: "date" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    numericFields: [],
    defaultSort: "createdAt",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Notification delivery, read status, type, and linked entity reports",
    permission: buildPermission("notifications", "view"),
    searchFields: ["title", "message", "type", "entityType"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Read", value: "readAt" }],
    filters: [{ key: "isRead", label: "Read", type: "boolean", options: [{ label: "Read", value: "true" }, { label: "Unread", value: "false" }] }],
    columns: [
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "entityType", label: "Entity" },
      { key: "isRead", label: "Read", type: "boolean" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    numericFields: [],
    defaultSort: "createdAt",
  },
  {
    id: "task-comments",
    label: "Task Comments",
    description: "Comment volume and activity across tasks",
    permission: buildPermission("task-comments", "view"),
    searchFields: ["content"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Updated", value: "updatedAt" }],
    filters: [],
    columns: [
      { key: "content", label: "Content" },
      { key: "createdAt", label: "Created", type: "date" },
      { key: "updatedAt", label: "Updated", type: "date" },
    ],
    numericFields: [],
    defaultSort: "createdAt",
  },
  {
    id: "task-checklists",
    label: "Task Checklists",
    description: "Checklist completion, order, and completion dates",
    permission: buildPermission("task-checklists", "view"),
    searchFields: ["title"],
    dateFields: [{ label: "Created", value: "createdAt" }, { label: "Completed", value: "completedAt" }, { label: "Updated", value: "updatedAt" }],
    filters: [{ key: "isCompleted", label: "Completion", type: "boolean", options: [{ label: "Completed", value: "true" }, { label: "Open", value: "false" }] }],
    columns: [
      { key: "title", label: "Title" },
      { key: "isCompleted", label: "Completed", type: "boolean" },
      { key: "order", label: "Order", type: "number" },
      { key: "completedAt", label: "Completed", type: "date" },
    ],
    numericFields: [{ label: "Order", value: "order" }],
    defaultSort: "createdAt",
  },
  {
    id: "task-attachments",
    label: "Task Attachments",
    description: "Uploaded files, mime types, and file size reports",
    permission: buildPermission("task-attachments", "view"),
    searchFields: ["fileName", "mimeType"],
    dateFields: [{ label: "Created", value: "createdAt" }],
    filters: [],
    columns: [
      { key: "fileName", label: "File" },
      { key: "mimeType", label: "Type" },
      { key: "fileSize", label: "Size", type: "number" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    numericFields: [{ label: "File Size", value: "fileSize" }],
    defaultSort: "createdAt",
  },
];

export function getReportResource(id: string) {
  return REPORT_RESOURCES.find((resource) => resource.id === id);
}
