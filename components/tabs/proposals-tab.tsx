"use client";

import { useMemo, useState } from "react";
import { z } from "zod/v4";
import { useCrud } from "@/lib/use-crud";
import CrudTab from "@/components/dashboard/crud-tab";
import DetailModal, { type DetailField } from "@/components/ui/detail-modal";
import StatusPicker, { type StatusOption } from "@/components/ui/status-picker";
import Badge from "@/components/ui/badge";
import type { ReportBadge } from "@/components/dashboard/report-badges";
import type { FieldConfig } from "@/types/dynamic-form";
import type { ColumnConfig, TableAction } from "@/types/dynamic-table";

// --- Schema ---
const schema = z.object({
  title: z.string().min(2, "Title required"),
  proposalNumber: z.string().min(1, "Number required"),
  description: z.string().optional(),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  status: z.string().min(1, "Status required"),
  subtotal: z.number().min(0),
  discount: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  expectedCost: z.number().min(0),
  expectedProfit: z.number().min(0),
  expectedMarginPercentage: z.number().min(0).max(100),
  validUntil: z.string().optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

// --- Status config ---
const statusVariant: Record<string, "primary" | "success" | "warning" | "destructive" | "default"> = {
  draft: "default", sent: "primary", viewed: "warning",
  accepted: "success", rejected: "destructive", expired: "default", cancelled: "default",
};

const statusOptions: StatusOption[] = [
  { value: "draft", label: "Draft", variant: "default" },
  { value: "sent", label: "Sent", variant: "primary" },
  { value: "viewed", label: "Viewed", variant: "warning" },
  { value: "accepted", label: "Accepted", variant: "success" },
  { value: "rejected", label: "Rejected", variant: "destructive" },
  { value: "expired", label: "Expired", variant: "default" },
  { value: "cancelled", label: "Cancelled", variant: "default" },
];

// --- Helpers ---
const fmt = (v: number) => {
  if (v >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B T";
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M T";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K T";
  return v + " T";
};

// --- Types ---
interface Lead { _id: string; name: string; companyName: string; [key: string]: unknown }
interface Client { _id: string; name: string; companyName: string; [key: string]: unknown }
interface Proposal {
  _id: string; title: string; proposalNumber: string; description?: string;
  leadId?: string; clientId?: string; status: string;
  subtotal: number; discount: number; tax: number; total: number;
  expectedCost: number; expectedProfit: number; expectedMarginPercentage: number;
  validUntil?: string; rejectionReason?: string; notes?: string;
  sentAt?: string; viewedAt?: string; acceptedAt?: string; rejectedAt?: string;
  createdAt: string; updatedAt?: string;
  [key: string]: unknown;
}

// --- Table columns ---
const columns: ColumnConfig<Proposal>[] = [
  { key: "proposalNumber", label: "#", sortable: true },
  { key: "title", label: "Title", sortable: true },
  { key: "status", label: "Status", sortable: true,
    render: (v) => <Badge variant={statusVariant[String(v)] ?? "default"}>{String(v).replace(/_/g, " ")}</Badge> },
  { key: "total", label: "Total", sortable: true, align: "right", render: (v) => fmt(Number(v)) },
  { key: "expectedCost", label: "Cost", sortable: true, align: "right", hideOnMobile: true, render: (v) => fmt(Number(v)) },
  { key: "expectedProfit", label: "Profit", sortable: true, align: "right", hideOnMobile: true,
    render: (v) => {
      const n = Number(v);
      return <span className={n > 0 ? "text-success font-medium" : n < 0 ? "text-destructive font-medium" : ""}>{fmt(n)}</span>;
    }},
  { key: "expectedMarginPercentage", label: "Margin", sortable: true, align: "right",
    render: (v) => {
      const n = Number(v);
      const color = n >= 40 ? "text-success" : n >= 20 ? "text-warning" : "text-destructive";
      return <span className={`font-semibold ${color}`}>{n.toFixed(1)}%</span>;
    }},
  { key: "validUntil", label: "Valid Until", sortable: true, hideOnMobile: true,
    render: (v) => {
      if (!v) return <span className="text-muted">—</span>;
      const d = new Date(String(v));
      const expired = d < new Date();
      return <span className={expired ? "text-destructive font-medium" : ""}>{d.toLocaleDateString()}</span>;
    }},
];

// --- Detail view ---
function buildDetailFields(p: Proposal, leadName?: string, clientName?: string): DetailField[] {
  return [
    { label: "Title", value: p.title },
    { label: "Proposal #", value: p.proposalNumber },
    { label: "Status", value: p.status, type: "badge", badgeVariant: statusVariant[p.status] ?? "default" },
    { label: "Valid Until", value: p.validUntil, type: "date" },
    { label: "Linked Lead", value: leadName, type: leadName ? "badge" : "text", badgeVariant: "primary" },
    { label: "Linked Client", value: clientName, type: clientName ? "badge" : "text", badgeVariant: "success" },
    { label: "Description", value: p.description, colSpan: 2 },
    { label: "Subtotal", value: p.subtotal, type: "currency" },
    { label: "Discount", value: p.discount, type: "currency" },
    { label: "Tax", value: p.tax, type: "currency" },
    { label: "Total", value: p.total, type: "currency" },
    { label: "Expected Cost", value: p.expectedCost, type: "currency" },
    { label: "Expected Profit", value: p.expectedProfit, type: "currency" },
    { label: "Expected Margin", value: p.expectedMarginPercentage, type: "percentage" },
    { label: "Sent At", value: p.sentAt, type: "date" },
    { label: "Viewed At", value: p.viewedAt, type: "date" },
    { label: "Accepted At", value: p.acceptedAt, type: "date" },
    { label: "Rejected At", value: p.rejectedAt, type: "date" },
    { label: "Rejection Reason", value: p.rejectionReason, colSpan: 2 },
    { label: "Notes", value: p.notes, colSpan: 2 },
    { label: "Created", value: p.createdAt, type: "date" },
    { label: "Updated", value: p.updatedAt, type: "date" },
  ];
}

// --- Component ---
export default function ProposalsTab() {
  const crud = useCrud<Proposal>({ endpoint: "proposals", label: "Proposal" });
  const leads = useCrud<Lead>({ endpoint: "leads", label: "Lead" });
  const clients = useCrud<Client>({ endpoint: "clients", label: "Client" });

  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [statusProposal, setStatusProposal] = useState<Proposal | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const leadOptions = useMemo(
    () => leads.data.map((l) => ({ label: `${l.name} — ${l.companyName}`, value: l._id })),
    [leads.data]
  );
  const clientOptions = useMemo(
    () => clients.data.map((c) => ({ label: `${c.name} — ${c.companyName}`, value: c._id })),
    [clients.data]
  );
  const leadMap = useMemo(() => new Map(leads.data.map((l) => [l._id, `${l.name} (${l.companyName})`])), [leads.data]);
  const clientMap = useMemo(() => new Map(clients.data.map((c) => [c._id, `${c.name} (${c.companyName})`])), [clients.data]);

  const fields: FieldConfig[] = useMemo(() => [
    { name: "title", label: "Title", type: "text" as const, required: true, placeholder: "Proposal title" },
    { name: "proposalNumber", label: "Proposal #", type: "text" as const, required: true, placeholder: "PROP-001" },
    { name: "leadId", label: "Lead", type: "searchselect" as const, placeholder: "Search leads...", options: leadOptions, description: "Link to an existing lead" },
    { name: "clientId", label: "Client", type: "searchselect" as const, placeholder: "Search clients...", options: clientOptions, description: "Link to an existing client" },
    { name: "status", label: "Status", type: "select" as const, required: true, options: statusOptions.map((s) => ({ label: s.label, value: s.value })) },
    { name: "validUntil", label: "Valid Until", type: "date" as const },
    { name: "subtotal", label: "Subtotal", type: "currency" as const, prefix: "T", required: true },
    { name: "discount", label: "Discount", type: "currency" as const, prefix: "T" },
    { name: "tax", label: "Tax", type: "currency" as const, prefix: "T" },
    { name: "total", label: "Total", type: "currency" as const, prefix: "T", required: true },
    { name: "expectedCost", label: "Expected Cost", type: "currency" as const, prefix: "T", description: "Estimated delivery cost" },
    { name: "expectedProfit", label: "Expected Profit", type: "currency" as const, prefix: "T" },
    { name: "expectedMarginPercentage", label: "Expected Margin", type: "percentage" as const },
    { name: "rejectionReason", label: "Rejection Reason", type: "text" as const, placeholder: "If rejected" },
    { name: "description", label: "Description", type: "textarea" as const, colSpan: 2 as const, placeholder: "Scope and deliverables..." },
    { name: "notes", label: "Notes", type: "textarea" as const, colSpan: 2 as const, placeholder: "Internal notes..." },
  ], [leadOptions, clientOptions]);

  async function handleStatusChange(newStatus: string) {
    if (!statusProposal) return;
    setStatusLoading(true);
    const extra: Record<string, unknown> = { status: newStatus };
    if (newStatus === "sent") extra.sentAt = new Date().toISOString();
    if (newStatus === "accepted") extra.acceptedAt = new Date().toISOString();
    if (newStatus === "rejected") extra.rejectedAt = new Date().toISOString();
    await crud.update(statusProposal._id, extra);
    setStatusLoading(false);
    setStatusProposal(null);
  }

  const extraActions: TableAction<Proposal>[] = [
    {
      label: "View",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
      onClick: (row) => setViewProposal(row),
    },
    {
      label: "Status",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
      onClick: (row) => setStatusProposal(row),
    },
  ];

  const badges: ReportBadge[] = useMemo(() => {
    const d = crud.data;
    const byStatus: Record<string, number> = {};
    let totalValue = 0;
    let totalProfit = 0;
    for (const p of d) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      if (p.status === "sent" || p.status === "viewed") totalValue += p.total;
      if (p.status === "accepted") totalProfit += p.expectedProfit;
    }
    return [
      { label: "Total", value: d.length, variant: "default" },
      { label: "Draft", value: byStatus["draft"] ?? 0, variant: "default" },
      { label: "Sent", value: byStatus["sent"] ?? 0, variant: "primary" },
      { label: "Accepted", value: byStatus["accepted"] ?? 0, variant: "success" },
      { label: "Rejected", value: byStatus["rejected"] ?? 0, variant: "destructive" },
      { label: "Open Value", value: fmt(totalValue), variant: "warning" },
      { label: "Won Profit", value: fmt(totalProfit), variant: "success" },
    ] as ReportBadge[];
  }, [crud.data]);

  return (
    <>
      <CrudTab
        title="Proposals"
        description="Manage proposals, quotes, and pricing"
        columns={columns}
        data={crud.data}
        loading={crud.loading}
        fields={fields}
        schema={schema}
        reportBadges={badges}
        extraActions={extraActions}
        onCreate={(d) => crud.create({ ...d, status: d.status ?? "draft", items: [] })}
        onUpdate={(id, d) => crud.update(id, d)}
        onDelete={(id) => crud.remove(id)}
        addLabel="+ New Proposal"
        nameKey="title"
      />

      <DetailModal
        open={viewProposal !== null}
        onClose={() => setViewProposal(null)}
        title={viewProposal?.title ?? ""}
        subtitle={`#${viewProposal?.proposalNumber ?? ""}`}
        fields={viewProposal ? buildDetailFields(
          viewProposal,
          leadMap.get(viewProposal.leadId ?? ""),
          clientMap.get(viewProposal.clientId ?? ""),
        ) : []}
      />

      <StatusPicker
        open={statusProposal !== null}
        onClose={() => setStatusProposal(null)}
        title={`Update Status — ${statusProposal?.title ?? ""}`}
        currentStatus={statusProposal?.status ?? ""}
        options={statusOptions}
        onSelect={handleStatusChange}
        isLoading={statusLoading}
      />
    </>
  );
}
