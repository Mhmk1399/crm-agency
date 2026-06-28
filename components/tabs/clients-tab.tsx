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

const schema = z.object({
  name: z.string().min(2, "Name required"),
  companyName: z.string().min(1, "Company required"),
  email: z.email("Invalid email"),
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
  contactPerson: z.string().min(2, "Contact person required"),
  address: z.string().optional(),
  billingAddress: z.string().optional(),
  taxId: z.string().optional(),
  leadId: z.string().optional(),
  source: z.string().min(1, "Source required"),
  notes: z.string().optional(),
});

interface Lead { _id: string; name: string; companyName: string; email: string; [key: string]: unknown }
interface Client {
  _id: string; name: string; companyName: string; email: string;
  phoneNumber?: string; website?: string; contactPerson: string;
  address?: string; billingAddress?: string; taxId?: string;
  leadId?: string; source: string; isActive: boolean; notes?: string;
  createdAt: string; updatedAt?: string;
  [key: string]: unknown;
}

const activeOptions: StatusOption[] = [
  { value: "true", label: "Active", variant: "success" },
  { value: "false", label: "Inactive", variant: "default" },
];

const staticClientColumns: ColumnConfig<Client>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "companyName", label: "Company", sortable: true },
  { key: "email", label: "Email", sortable: true, hideOnMobile: true },
  { key: "phoneNumber", label: "Phone", sortable: true, hideOnMobile: true, render: (v) => v ? String(v) : <span className="text-muted">—</span> },
  { key: "contactPerson", label: "Contact", sortable: true, hideOnMobile: true },
  { key: "source", label: "Source", sortable: true, hideOnMobile: true, render: (v) => <span className="capitalize">{String(v ?? "—").replace(/_/g, " ")}</span> },
];

function buildDetailFields(client: Client, leadName?: string): DetailField[] {
  return [
    { label: "Client Name", value: client.name },
    { label: "Company", value: client.companyName },
    { label: "Email", value: client.email, type: "email" },
    { label: "Phone", value: client.phoneNumber },
    { label: "Website", value: client.website, type: "url" },
    { label: "Contact Person", value: client.contactPerson },
    { label: "Source", value: client.source, type: "badge", badgeVariant: "primary" },
    { label: "Status", value: client.isActive ? "Active" : "Inactive", type: "badge", badgeVariant: client.isActive ? "success" : "default" },
    { label: "Linked Lead", value: leadName ?? (client.leadId ? client.leadId : null), type: client.leadId ? "badge" : "text", badgeVariant: "primary" },
    { label: "Address", value: client.address, colSpan: 2 },
    { label: "Billing Address", value: client.billingAddress, colSpan: 2 },
    { label: "Tax ID", value: client.taxId },
    { label: "Notes", value: client.notes, colSpan: 2 },
    { label: "Created", value: client.createdAt, type: "date" },
    { label: "Updated", value: client.updatedAt, type: "date" },
  ];
}

export default function ClientsTab() {
  const crud = useCrud<Client>({ endpoint: "clients", label: "Client" });
  const leads = useCrud<Lead>({ endpoint: "leads", label: "Lead" });

  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [statusClient, setStatusClient] = useState<Client | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const columns: ColumnConfig<Client>[] = useMemo(() => [
    ...staticClientColumns,
    { key: "isActive", label: "Status",
      render: (_v, row) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); setStatusClient(row); }} className="cursor-pointer">
          <Badge variant={row.isActive ? "success" : "default"}>{row.isActive ? "Active" : "Inactive"}</Badge>
        </button>
      ) },
  ], []);

  const leadOptions = useMemo(
    () => leads.data.map((l) => ({ label: `${l.name} — ${l.companyName}`, value: l._id })),
    [leads.data]
  );

  const leadMap = useMemo(
    () => new Map(leads.data.map((l) => [l._id, `${l.name} (${l.companyName})`])),
    [leads.data]
  );

  const fields: FieldConfig[] = useMemo(() => [
    { name: "leadId", label: "From Lead", type: "searchselect" as const, placeholder: "Search leads...", options: leadOptions, description: "Optional — link this client to an existing lead" },
    { name: "name", label: "Client Name", type: "text" as const, required: true, placeholder: "Full name" },
    { name: "companyName", label: "Company", type: "text" as const, required: true, placeholder: "Company name" },
    { name: "email", label: "Email", type: "email" as const, required: true, placeholder: "email@company.com" },
    { name: "phoneNumber", label: "Phone", type: "tel" as const, placeholder: "+98 9xx xxx xxxx" },
    { name: "website", label: "Website", type: "url" as const, placeholder: "https://company.com" },
    { name: "contactPerson", label: "Contact Person", type: "text" as const, required: true, placeholder: "Primary contact" },
    { name: "source", label: "Source", type: "select" as const, required: true, options: [
      { label: "Website", value: "website" }, { label: "Referral", value: "referral" },
      { label: "LinkedIn", value: "linkedin" }, { label: "Cold Outreach", value: "cold_outreach" },
      { label: "Event", value: "event" }, { label: "Advertisement", value: "advertisement" },
      { label: "Other", value: "other" },
    ]},
    { name: "taxId", label: "Tax ID", type: "text" as const, placeholder: "Tax registration number" },
    { name: "address", label: "Address", type: "textarea" as const, colSpan: 2 as const, placeholder: "Office address" },
    { name: "billingAddress", label: "Billing Address", type: "textarea" as const, colSpan: 2 as const, placeholder: "Billing address (if different)" },
    { name: "notes", label: "Notes", type: "textarea" as const, colSpan: 2 as const, placeholder: "Additional notes..." },
  ], [leadOptions]);

  async function handleStatusChange(newVal: string) {
    if (!statusClient) return;
    setStatusLoading(true);
    await crud.update(statusClient._id, { isActive: newVal === "true" });
    setStatusLoading(false);
    setStatusClient(null);
  }

  const extraActions: TableAction<Client>[] = [
    {
      label: "View",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
      onClick: (row) => setViewClient(row),
    },
  ];

  const badges: ReportBadge[] = useMemo(() => {
    const total = crud.data.length;
    const active = crud.data.filter((c) => c.isActive).length;
    const inactive = total - active;
    const fromLeads = crud.data.filter((c) => c.leadId).length;
    return [
      { label: "Total", value: total, variant: "default" },
      { label: "Active", value: active, variant: "success" },
      { label: "Inactive", value: inactive, variant: inactive > 0 ? "warning" : "default" },
      { label: "From Leads", value: fromLeads, variant: "primary" },
    ] as ReportBadge[];
  }, [crud.data]);

  return (
    <>
      <CrudTab
        title="Clients"
        description="Manage your client relationships"
        columns={columns}
        data={crud.data}
        loading={crud.loading}
        fields={fields}
        schema={schema}
        reportBadges={badges}
        extraActions={extraActions}
        onCreate={(d) => crud.create(d)}
        onUpdate={(id, d) => crud.update(id, d)}
        onDelete={(id) => crud.remove(id)}
        addLabel="+ New Client"
      />

      <DetailModal
        open={viewClient !== null}
        onClose={() => setViewClient(null)}
        title={viewClient?.name ?? ""}
        subtitle={viewClient?.companyName}
        fields={viewClient ? buildDetailFields(viewClient, leadMap.get(viewClient.leadId ?? "")) : []}
      />

      <StatusPicker
        open={statusClient !== null}
        onClose={() => setStatusClient(null)}
        title={`Update Status — ${statusClient?.name ?? ""}`}
        currentStatus={statusClient?.isActive ? "true" : "false"}
        options={activeOptions}
        onSelect={handleStatusChange}
        isLoading={statusLoading}
      />
    </>
  );
}
