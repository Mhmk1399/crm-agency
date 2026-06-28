import type { TransitionMap } from "./state-machine";
import type { LeadStatus } from "@/models/Lead";
import type { ProposalStatus } from "@/models/Proposal";
import type { ProjectStatus } from "@/models/Project";
import type { TaskStatus } from "@/models/Task";
import type { InvoiceStatus } from "@/models/Invoice";


export const LEAD_TRANSITIONS: TransitionMap<LeadStatus> = {
  new: ["contacted"],
  contacted: ["qualified", "lost"],
  qualified: ["proposal_sent", "lost"],
  proposal_sent: ["negotiation", "lost"],
  negotiation: ["won", "lost"],
  won: [],
  lost: [],
};

export const PROPOSAL_TRANSITIONS: TransitionMap<ProposalStatus> = {
  draft: ["sent", "cancelled"],
  sent: ["viewed", "accepted", "rejected", "expired"],
  viewed: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
  cancelled: [],
  expired: [],
};

export const PROJECT_TRANSITIONS: TransitionMap<ProjectStatus> = {
  planned: ["active", "cancelled"],
  active: ["on_hold", "client_review", "cancelled"],
  on_hold: ["active"],
  client_review: ["active", "completed"],
  completed: [],
  cancelled: [],
};

export const TASK_TRANSITIONS: TransitionMap<TaskStatus> = {
  backlog: ["todo"],
  todo: ["in_progress", "blocked"],
  in_progress: ["review", "blocked"],
  review: ["in_progress", "done", "blocked"],
  blocked: ["todo", "in_progress"],
  done: [],
};

export const INVOICE_TRANSITIONS: TransitionMap<InvoiceStatus> = {
  draft: ["sent", "cancelled"],
  sent: ["partially_paid", "paid", "overdue"],
  partially_paid: ["paid", "overdue"],
  paid: [],
  overdue: ["partially_paid", "paid"],
  cancelled: [],
};

