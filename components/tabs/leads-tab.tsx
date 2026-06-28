"use client";

import { useMemo, useState, useCallback } from "react";
import { z } from "zod/v4";
import { useCrud } from "@/lib/use-crud";
import CrudTab from "@/components/dashboard/crud-tab";
import Badge from "@/components/ui/badge";
import DetailModal, { type DetailField } from "@/components/ui/detail-modal";
import StatusPicker, { type StatusOption } from "@/components/ui/status-picker";
import type { ReportBadge } from "@/components/dashboard/report-badges";
import type { FieldConfig } from "@/types/dynamic-form";
import type { ColumnConfig, TableAction } from "@/types/dynamic-table";
import toast from "react-hot-toast";

// --- Schema ---
const schema = z.object({
  name: z.string().min(2, "Name required"),
  companyName: z.string().min(1, "Company required"),
  email: z.email("Invalid email"),
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
  source: z.string().min(1, "Source required"),
  status: z.string().min(1, "Status required"),
  estimatedValue: z.number().min(0),
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  lostReason: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

// --- Form fields ---
const fields: FieldConfig[] = [
  { name: "name", label: "Contact Name", type: "text", placeholder: "Full name", required: true },
  { name: "companyName", label: "Company", type: "text", placeholder: "Company name", required: true },
  { name: "email", label: "Email", type: "email", placeholder: "email@company.com", required: true },
  { name: "phoneNumber", label: "Phone", type: "tel", placeholder: "+98 9xx xxx xxxx" },
  { name: "website", label: "Website", type: "url", placeholder: "https://company.com" },
  { name: "source", label: "Lead Source", type: "select", required: true, options: [
    { label: "Website", value: "website" }, { label: "Referral", value: "referral" },
    { label: "LinkedIn", value: "linkedin" }, { label: "Cold Outreach", value: "cold_outreach" },
    { label: "Event", value: "event" }, { label: "Advertisement", value: "advertisement" },
    { label: "Other", value: "other" },
  ]},
  { name: "status", label: "Status", type: "select", required: true, options: [
    { label: "New", value: "new" }, { label: "Contacted", value: "contacted" },
    { label: "Qualified", value: "qualified" }, { label: "Proposal Sent", value: "proposal_sent" },
    { label: "Negotiation", value: "negotiation" }, { label: "Won", value: "won" },
    { label: "Lost", value: "lost" },
  ]},
  { name: "estimatedValue", label: "Estimated Value", type: "currency", prefix: "T", required: true },
  { name: "probability", label: "Probability", type: "percentage", placeholder: "0-100" },
  { name: "expectedCloseDate", label: "Expected Close Date", type: "date" },
  { name: "nextFollowUpAt", label: "Next Follow-Up", type: "date" },
  { name: "lostReason", label: "Lost Reason", type: "text", placeholder: "Why was this lead lost?" },
  { name: "tags", label: "Tags", type: "text", placeholder: "Comma separated tags", description: "Separate with commas" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2, placeholder: "Additional notes..." },
];

// --- Status options for picker ---
const statusOptions: StatusOption[] = [
  { value: "new", label: "New", variant: "primary" },
  { value: "contacted", label: "Contacted", variant: "warning" },
  { value: "qualified", label: "Qualified", variant: "success" },
  { value: "proposal_sent", label: "Proposal Sent", variant: "primary" },
  { value: "negotiation", label: "Negotiation", variant: "warning" },
  { value: "won", label: "Won", variant: "success" },
  { value: "lost", label: "Lost", variant: "destructive" },
];

// --- Helpers ---
const fmt = (v: number) => {
  if (v >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B T";
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M T";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K T";
  return v + " T";
};

const statusVariant: Record<string, "primary" | "success" | "warning" | "destructive" | "default"> = {
  new: "primary", contacted: "warning", qualified: "success",
  proposal_sent: "primary", negotiation: "warning", won: "success", lost: "destructive",
};

// --- Lead type ---
interface Lead {
  _id: string; name: string; companyName: string; email: string;
  phoneNumber?: string; website?: string; source: string; status: string;
  estimatedValue: number; probability: number;
  expectedCloseDate?: string; nextFollowUpAt?: string;
  lostReason?: string; tags: string[]; notes?: string;
  createdAt: string; updatedAt?: string;
  [key: string]: unknown;
}

// --- Table columns (static ones — status column is built inside the component) ---
const staticColumns: Omit<ColumnConfig<Lead>, "render">[] = [
  { key: "name", label: "Contact", sortable: true },
  { key: "companyName", label: "Company", sortable: true, hideOnMobile: true },
  { key: "email", label: "Email", sortable: true, hideOnMobile: true },
];

// --- Detail view field builder ---
function buildDetailFields(lead: Lead): DetailField[] {
  return [
    { label: "Contact Name", value: lead.name },
    { label: "Company", value: lead.companyName },
    { label: "Email", value: lead.email, type: "email" },
    { label: "Phone", value: lead.phoneNumber },
    { label: "Website", value: lead.website, type: "url" },
    { label: "Source", value: lead.source, type: "badge", badgeVariant: "primary" },
    { label: "Status", value: lead.status, type: "badge", badgeVariant: statusVariant[lead.status] ?? "default" },
    { label: "Estimated Value", value: lead.estimatedValue, type: "currency" },
    { label: "Probability", value: lead.probability, type: "percentage" },
    { label: "Expected Close", value: lead.expectedCloseDate, type: "date" },
    { label: "Next Follow-Up", value: lead.nextFollowUpAt, type: "date" },
    { label: "Lost Reason", value: lead.lostReason },
    { label: "Tags", value: lead.tags, type: "tags", colSpan: 2 },
    { label: "Notes", value: lead.notes, colSpan: 2 },
    { label: "Created", value: lead.createdAt, type: "date" },
    { label: "Updated", value: lead.updatedAt, type: "date" },
  ];
}

// --- Component ---
export default function LeadsTab() {
  const crud = useCrud<Lead>({ endpoint: "leads", label: "Lead" });

  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [statusLead, setStatusLead] = useState<Lead | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const columns: ColumnConfig<Lead>[] = useMemo(() => [
    ...staticColumns as ColumnConfig<Lead>[],
    { key: "source", label: "Source", sortable: true, hideOnMobile: true,
      render: (v) => <span className="capitalize">{String(v).replace(/_/g, " ")}</span> },
    { key: "status", label: "Status", sortable: true,
      render: (_v, row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setStatusLead(row); }}
          className="cursor-pointer"
        >
          <Badge variant={statusVariant[String(row.status)] ?? "default"}>
            {String(row.status).replace(/_/g, " ")}
          </Badge>
        </button>
      ) },
    { key: "estimatedValue", label: "Value", sortable: true, align: "right",
      render: (v) => fmt(Number(v)) },
    { key: "probability", label: "Prob.", sortable: true, align: "right",
      render: (v) => `${v}%` },
    { key: "nextFollowUpAt", label: "Follow-Up", sortable: true, hideOnMobile: true,
      render: (v) => {
        if (!v) return <span className="text-muted">—</span>;
        const d = new Date(String(v));
        const overdue = d < new Date();
        return <span className={overdue ? "text-destructive font-medium" : ""}>{d.toLocaleDateString()}</span>;
      }},
  ], []);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!statusLead) return;
    setStatusLoading(true);
    const result = await crud.update(statusLead._id, { status: newStatus });
    setStatusLoading(false);
    if (result) {
      // Auto-create client when lead is won
      if (newStatus === "won") {
        try {
          const res = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: statusLead.name,
              companyName: statusLead.companyName,
              email: statusLead.email,
              phoneNumber: statusLead.phoneNumber ?? "",
              website: statusLead.website ?? "",
              contactPerson: statusLead.name,
              source: statusLead.source,
              leadId: statusLead._id,
              isActive: true,
            }),
          });
          const json = await res.json();
          if (json.success) {
            toast.success(`Client "${statusLead.companyName}" created from won lead`);
          } else {
            toast.error(json.error?.message ?? "Failed to auto-create client");
          }
        } catch {
          toast.error("Failed to auto-create client");
        }
      }
      setStatusLead(null);
    }
  }, [statusLead, crud]);

  const extraActions: TableAction<Lead>[] = [
    {
      label: "View",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
      onClick: (row) => setViewLead(row),
    },
  ];

  const badges: ReportBadge[] = useMemo(() => {
    const d = crud.data;
    const total = d.length;
    const byStatus: Record<string, number> = {};
    let pipelineValue = 0;
    let weightedValue = 0;
    let followUpsDue = 0;
    const now = new Date();

    for (const lead of d) {
      byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
      if (!["won", "lost"].includes(lead.status)) {
        pipelineValue += lead.estimatedValue;
        weightedValue += Math.round(lead.estimatedValue * lead.probability / 100);
      }
      if (lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) <= now && !["won", "lost"].includes(lead.status)) {
        followUpsDue++;
      }
    }

    return [
      { label: "Total", value: total, variant: "default" },
      { label: "New", value: byStatus["new"] ?? 0, variant: "primary" },
      { label: "Qualified", value: byStatus["qualified"] ?? 0, variant: "success" },
      { label: "Won", value: byStatus["won"] ?? 0, variant: "success" },
      { label: "Lost", value: byStatus["lost"] ?? 0, variant: "destructive" },
      { label: "Pipeline", value: fmt(pipelineValue), variant: "warning" },
      { label: "Weighted", value: fmt(weightedValue), variant: "primary" },
      { label: "Follow-Ups Due", value: followUpsDue, variant: followUpsDue > 0 ? "destructive" : "default" },
    ] as ReportBadge[];
  }, [crud.data]);

  return (
    <>
      <CrudTab
        title="Leads"
        description="Manage your sales pipeline"
        columns={columns}
        data={crud.data}
        loading={crud.loading}
        fields={fields}
        schema={schema}
        reportBadges={badges}
        extraActions={extraActions}
        onCreate={(d) => {
          const tags = typeof d.tags === "string" ? d.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
          return crud.create({ ...d, tags, status: d.status ?? "new" });
        }}
        onUpdate={(id, d) => {
          const tags = typeof d.tags === "string" ? d.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : d.tags;
          return crud.update(id, { ...d, tags });
        }}
        onDelete={(id) => crud.remove(id)}
        addLabel="+ New Lead"
      />

      {/* View Detail Modal */}
      <DetailModal
        open={viewLead !== null}
        onClose={() => setViewLead(null)}
        title={viewLead?.name ?? ""}
        subtitle={viewLead?.companyName}
        fields={viewLead ? buildDetailFields(viewLead) : []}
      />

      {/* Status Picker Modal */}
      <StatusPicker
        open={statusLead !== null}
        onClose={() => setStatusLead(null)}
        title={`Update Status — ${statusLead?.name ?? ""}`}
        currentStatus={statusLead?.status ?? ""}
        options={statusOptions}
        onSelect={handleStatusChange}
        isLoading={statusLoading}
      />
    </>
  );
}
