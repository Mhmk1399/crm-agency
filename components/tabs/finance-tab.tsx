"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod/v4";
import { useCrud } from "@/lib/use-crud";
import CrudTab from "@/components/dashboard/crud-tab";
import Badge from "@/components/ui/badge";
import StatusPicker, { type StatusOption } from "@/components/ui/status-picker";
import type { ReportBadge } from "@/components/dashboard/report-badges";
import type { FieldConfig } from "@/types/dynamic-form";
import type { ColumnConfig } from "@/types/dynamic-table";
import { useSession } from "@/lib/use-session";

// ── Types ──
interface Invoice { _id: string; invoiceNumber: string; currency: string; total: number; paidAmount: number; outstandingAmount: number; status: string; clientId?: string; projectId?: string; issuedDate: string; dueDate: string; notes?: string; [key: string]: unknown }
interface Payment { _id: string; invoiceId: string; currency: string; amount: number; method: string; reference?: string; paidAt: string; notes?: string; [key: string]: unknown }
interface OpExpense { _id: string; description: string; category: string; currency: string; amount: number; date: string; notes?: string; [key: string]: unknown }
interface ProjectExpense { _id: string; description: string; category: string; currency: string; amount: number; projectId: string; date: string; isApproved: boolean; [key: string]: unknown }
interface Project { _id: string; name: string; projectCode: string; [key: string]: unknown }
interface Client { _id: string; name: string; companyName: string; [key: string]: unknown }

type SubTab = "reports" | "invoices" | "payments" | "operational";

// ── Currency helpers ──
const CURRENCIES = [
  { label: "Toman (IRR)", value: "IRR" },
  { label: "US Dollar (USD)", value: "USD" },
  { label: "British Pound (GBP)", value: "GBP" },
];
const currSymbol: Record<string, string> = { IRR: "T", USD: "$", GBP: "£" };
const fmtMoney = (v: number, cur: string) => {
  const sym = currSymbol[cur] ?? cur;
  if (v >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B " + sym;
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M " + sym;
  if (v >= 1e3) return new Intl.NumberFormat().format(v) + " " + sym;
  return v + " " + sym;
};

// ── Schemas ──
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Required"),
  currency: z.string().min(1, "Required"),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  subtotal: z.number().min(0),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  total: z.number().min(0),
  issuedDate: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice required"),
  currency: z.string().min(1, "Required"),
  amount: z.number().min(1, "Amount required"),
  method: z.string().min(1, "Method required"),
  reference: z.string().optional(),
  paidAt: z.string().min(1, "Date required"),
  notes: z.string().optional(),
});

const opExpenseSchema = z.object({
  description: z.string().min(2, "Required"),
  category: z.string().min(1, "Required"),
  currency: z.string().min(1, "Required"),
  amount: z.number().min(1, "Required"),
  date: z.string().min(1, "Required"),
  notes: z.string().optional(),
});

// ── Status ──
const invStatusVariant: Record<string, "default" | "primary" | "success" | "warning" | "destructive"> = {
  draft: "default", sent: "primary", partially_paid: "warning", paid: "success", overdue: "destructive", cancelled: "default",
};
const invStatusOptions: StatusOption[] = [
  { value: "draft", label: "Draft", variant: "default" },
  { value: "sent", label: "Sent", variant: "primary" },
  { value: "partially_paid", label: "Partially Paid", variant: "warning" },
  { value: "paid", label: "Paid", variant: "success" },
  { value: "overdue", label: "Overdue", variant: "destructive" },
  { value: "cancelled", label: "Cancelled", variant: "default" },
];

const opCategories = [
  { label: "Rent", value: "rent" }, { label: "Electricity", value: "electricity" },
  { label: "Internet", value: "internet" }, { label: "Salary", value: "salary" },
  { label: "Insurance", value: "insurance" }, { label: "Software Subscription", value: "software_subscription" },
  { label: "Equipment", value: "equipment" }, { label: "Office Supplies", value: "office_supplies" },
  { label: "Tax", value: "tax" }, { label: "Other", value: "other" },
];

// ── Sub-tab button ──
function TabBtn({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${active ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground hover:bg-muted-bg"}`}>
      {label}
      {count !== undefined && count > 0 && <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-[11px]">{count}</span>}
    </button>
  );
}

// ── Main ──
export default function FinanceTab() {
  const { isAdmin, isFinance } = useSession();
  const canManage = isAdmin || isFinance;
  const [subTab, setSubTab] = useState<SubTab>(canManage ? "reports" : "payments");
  const [statusInvoice, setStatusInvoice] = useState<Invoice | null>(null);

  const invoiceCrud = useCrud<Invoice>({ endpoint: "invoices", label: "Invoice" });
  const paymentCrud = useCrud<Payment>({ endpoint: "payments", label: "Payment" });
  const opExpenseCrud = useCrud<OpExpense>({ endpoint: "operational-expenses", label: "Expense" });

  const { data: projectExpenses = [] } = useQuery<ProjectExpense[]>({
    queryKey: ["project-expenses-all"],
    queryFn: async () => { const r = await fetch("/api/project-expenses?limit=500"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => { const r = await fetch("/api/projects?limit=200"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => { const r = await fetch("/api/clients?limit=200"); const j = await r.json(); return j.success ? (j.data.data ?? []) : []; },
  });

  const clientMap = useMemo(() => new Map(clients.map(c => [c._id, c.companyName])), [clients]);
  const projectOptions = useMemo(() => projects.map(p => ({ label: `${p.projectCode} — ${p.name}`, value: p._id })), [projects]);
  const clientOptions = useMemo(() => clients.map(c => ({ label: `${c.name} — ${c.companyName}`, value: c._id })), [clients]);
  const invoiceOptions = useMemo(() => invoiceCrud.data.map(i => ({ label: `${i.invoiceNumber} (${fmtMoney(i.outstandingAmount, i.currency)})`, value: i._id })), [invoiceCrud.data]);

  // ── Reports data ──
  const reports = useMemo(() => {
    const byCurrency: Record<string, { revenue: number; outstanding: number; overdue: number; projectCosts: number; opCosts: number }> = {};
    const ensure = (c: string) => { if (!byCurrency[c]) byCurrency[c] = { revenue: 0, outstanding: 0, overdue: 0, projectCosts: 0, opCosts: 0 }; };

    for (const inv of invoiceCrud.data) {
      const cur = inv.currency || "IRR";
      ensure(cur);
      if (inv.status === "paid") byCurrency[cur].revenue += inv.total;
      if (["sent", "partially_paid", "overdue"].includes(inv.status)) byCurrency[cur].outstanding += inv.outstandingAmount;
      if (inv.status === "overdue") byCurrency[cur].overdue += inv.outstandingAmount;
    }

    for (const pe of projectExpenses) {
      const cur = pe.currency || "IRR";
      ensure(cur);
      if (pe.isApproved) byCurrency[cur].projectCosts += pe.amount;
    }

    for (const oe of opExpenseCrud.data) {
      const cur = oe.currency || "IRR";
      ensure(cur);
      byCurrency[cur].opCosts += oe.amount;
    }

    return byCurrency;
  }, [invoiceCrud.data, projectExpenses, opExpenseCrud.data]);

  // ── Invoice fields ──
  const invoiceFields: FieldConfig[] = useMemo(() => [
    { name: "invoiceNumber", label: "Invoice #", type: "text" as const, required: true, placeholder: "INV-001" },
    { name: "currency", label: "Currency", type: "select" as const, required: true, options: CURRENCIES },
    { name: "clientId", label: "Client", type: "searchselect" as const, placeholder: "Search clients...", options: clientOptions },
    { name: "projectId", label: "Project", type: "searchselect" as const, placeholder: "Search projects...", options: projectOptions },
    { name: "subtotal", label: "Subtotal", type: "currency" as const, required: true },
    { name: "discount", label: "Discount", type: "currency" as const },
    { name: "tax", label: "Tax", type: "currency" as const },
    { name: "total", label: "Total", type: "currency" as const, required: true },
    { name: "issuedDate", label: "Issue Date", type: "date" as const, required: true },
    { name: "dueDate", label: "Due Date", type: "date" as const, required: true },
    { name: "notes", label: "Notes", type: "textarea" as const, colSpan: 2 as const },
  ], [clientOptions, projectOptions]);

  const invoiceColumns: ColumnConfig<Invoice>[] = useMemo(() => [
    { key: "invoiceNumber", label: "#", sortable: true },
    { key: "clientId", label: "Client", sortable: true, hideOnMobile: true, render: (v) => v ? clientMap.get(String(v)) ?? "—" : "—" },
    { key: "currency", label: "Cur.", sortable: true, render: (v) => <Badge variant="default">{String(v)}</Badge> },
    { key: "status", label: "Status", sortable: true,
      render: (_v, row) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); setStatusInvoice(row); }} className="cursor-pointer">
          <Badge variant={invStatusVariant[row.status] ?? "default"}>{row.status.replace(/_/g, " ")}</Badge>
        </button>
      ),
    },
    { key: "total", label: "Total", sortable: true, align: "right", render: (v, row) => fmtMoney(Number(v), row.currency) },
    { key: "paidAmount", label: "Paid", sortable: true, align: "right", render: (v, row) => fmtMoney(Number(v), row.currency) },
    { key: "outstandingAmount", label: "Outstanding", sortable: true, align: "right", render: (v, row) => fmtMoney(Number(v), row.currency) },
    { key: "dueDate", label: "Due", sortable: true, hideOnMobile: true, render: (v) => {
      if (!v) return "—";
      const d = new Date(String(v));
      const overdue = d < new Date();
      return <span className={overdue ? "text-destructive font-medium" : ""}>{d.toLocaleDateString()}</span>;
    }},
  ], [clientMap]);

  // ── Payment fields ──
  const paymentFields: FieldConfig[] = useMemo(() => [
    { name: "invoiceId", label: "Invoice", type: "searchselect" as const, required: true, placeholder: "Search invoices...", options: invoiceOptions },
    { name: "currency", label: "Currency", type: "select" as const, required: true, options: CURRENCIES },
    { name: "amount", label: "Amount", type: "currency" as const, required: true },
    { name: "method", label: "Method", type: "select" as const, required: true, options: [
      { label: "Bank Transfer", value: "bank_transfer" }, { label: "Cash", value: "cash" },
      { label: "Card", value: "card" }, { label: "Cheque", value: "cheque" },
      { label: "Online Gateway", value: "online" }, { label: "Other", value: "other" },
    ]},
    { name: "reference", label: "Reference / Tracking #", type: "text" as const, placeholder: "Transaction reference" },
    { name: "paidAt", label: "Payment Date", type: "date" as const, required: true },
    { name: "notes", label: "Notes", type: "textarea" as const, colSpan: 2 as const },
  ], [invoiceOptions]);

  const paymentColumns: ColumnConfig<Payment>[] = useMemo(() => [
    { key: "invoiceId", label: "Invoice", sortable: true, render: (v) => {
      const inv = invoiceCrud.data.find(i => i._id === String(v));
      return inv ? inv.invoiceNumber : "—";
    }},
    { key: "currency", label: "Cur.", render: (v) => <Badge variant="default">{String(v)}</Badge> },
    { key: "amount", label: "Amount", sortable: true, align: "right", render: (v, row) => fmtMoney(Number(v), row.currency) },
    { key: "method", label: "Method", sortable: true, render: (v) => <span className="capitalize">{String(v).replace(/_/g, " ")}</span> },
    { key: "reference", label: "Reference", hideOnMobile: true, render: (v) => v ? String(v) : "—" },
    { key: "paidAt", label: "Date", sortable: true, render: (v) => new Date(String(v)).toLocaleDateString() },
  ], [invoiceCrud.data]);

  // ── Operational expense fields ──
  const opExpenseFields: FieldConfig[] = useMemo(() => [
    { name: "description", label: "Description", type: "text" as const, required: true, placeholder: "e.g. June office rent" },
    { name: "category", label: "Category", type: "select" as const, required: true, options: opCategories },
    { name: "currency", label: "Currency", type: "select" as const, required: true, options: CURRENCIES },
    { name: "amount", label: "Amount", type: "currency" as const, required: true },
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "notes", label: "Notes", type: "textarea" as const, colSpan: 2 as const },
  ], []);

  const opExpenseColumns: ColumnConfig<OpExpense>[] = [
    { key: "description", label: "Description", sortable: true },
    { key: "category", label: "Category", sortable: true, hideOnMobile: true, render: (v) => <span className="capitalize">{String(v).replace(/_/g, " ")}</span> },
    { key: "currency", label: "Cur.", render: (v) => <Badge variant="default">{String(v)}</Badge> },
    { key: "amount", label: "Amount", sortable: true, align: "right", render: (v, row) => fmtMoney(Number(v), row.currency) },
    { key: "date", label: "Date", sortable: true, render: (v) => new Date(String(v)).toLocaleDateString() },
  ];

  // ── Invoice badges ──
  const invoiceBadges: ReportBadge[] = useMemo(() => {
    const d = invoiceCrud.data;
    const byStatus: Record<string, number> = {};
    for (const i of d) byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
    return [
      { label: "Total", value: d.length, variant: "default" },
      { label: "Draft", value: byStatus["draft"] ?? 0, variant: "default" },
      { label: "Sent", value: byStatus["sent"] ?? 0, variant: "primary" },
      { label: "Paid", value: byStatus["paid"] ?? 0, variant: "success" },
      { label: "Overdue", value: byStatus["overdue"] ?? 0, variant: (byStatus["overdue"] ?? 0) > 0 ? "destructive" : "default" },
    ] as ReportBadge[];
  }, [invoiceCrud.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Finance</h1>
        <p className="text-[14px] text-muted mt-1">{canManage ? "Revenue, costs, and profitability across currencies" : "Your payments and salary information"}</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 bg-muted-bg rounded-lg p-1 w-fit">
        {canManage && <TabBtn label="Reports" active={subTab === "reports"} onClick={() => setSubTab("reports")} />}
        {canManage && <TabBtn label="Invoices" active={subTab === "invoices"} onClick={() => setSubTab("invoices")} count={invoiceCrud.data.length} />}
        <TabBtn label="Payments" active={subTab === "payments"} onClick={() => setSubTab("payments")} count={paymentCrud.data.length} />
        {canManage && <TabBtn label="Operational Costs" active={subTab === "operational"} onClick={() => setSubTab("operational")} count={opExpenseCrud.data.length} />}
      </div>

      {/* ═══ REPORTS ═══ */}
      {subTab === "reports" && (
        <div className="space-y-6">
          {Object.entries(reports).length === 0 ? (
            <div className="glass rounded-[var(--radius)] p-10 text-center">
              <p className="text-muted text-[14px]">No financial data yet. Create invoices and log expenses to see reports.</p>
            </div>
          ) : (
            Object.entries(reports).map(([currency, data]) => {
              const totalCosts = data.projectCosts + data.opCosts;
              const profit = data.revenue - totalCosts;
              const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
              return (
                <div key={currency} className="glass rounded-[var(--radius)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-separator flex items-center gap-2">
                    <Badge variant="primary">{currency}</Badge>
                    <h3 className="text-[14px] font-semibold text-foreground">{currency === "IRR" ? "Toman" : currency === "USD" ? "US Dollar" : "British Pound"}</h3>
                  </div>
                  <div className="p-5">
                    {/* Stat row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                      {[
                        { label: "Revenue", value: fmtMoney(data.revenue, currency), color: "text-success" },
                        { label: "Project Costs", value: fmtMoney(data.projectCosts, currency), color: "text-warning" },
                        { label: "Operational Costs", value: fmtMoney(data.opCosts, currency), color: "text-warning" },
                        { label: "Total Costs", value: fmtMoney(totalCosts, currency), color: totalCosts > data.revenue ? "text-destructive" : "text-foreground" },
                        { label: "Net Profit", value: fmtMoney(profit, currency), color: profit >= 0 ? "text-success" : "text-destructive" },
                        { label: "Margin", value: `${margin.toFixed(1)}%`, color: margin >= 40 ? "text-success" : margin >= 20 ? "text-warning" : "text-destructive" },
                      ].map(c => (
                        <div key={c.label} className="glass rounded-[var(--radius-sm)] p-3 text-center">
                          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{c.label}</p>
                          <p className={`text-[16px] font-bold mt-0.5 ${c.color}`}>{c.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Outstanding */}
                    {(data.outstanding > 0 || data.overdue > 0) && (
                      <div className="flex items-center gap-4 text-[13px]">
                        {data.outstanding > 0 && (
                          <span className="text-muted">Outstanding: <span className="font-semibold text-foreground">{fmtMoney(data.outstanding, currency)}</span></span>
                        )}
                        {data.overdue > 0 && (
                          <span className="text-destructive font-medium">Overdue: {fmtMoney(data.overdue, currency)}</span>
                        )}
                      </div>
                    )}

                    {/* Formulas */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted font-mono">
                      <span>Revenue = Σ paid invoices</span>
                      <span>Project Costs = Σ approved project expenses</span>
                      <span>Operational Costs = Σ operational expenses</span>
                      <span>Net Profit = Revenue − (Project + Operational)</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ INVOICES ═══ */}
      {subTab === "invoices" && (
        <>
          <CrudTab
            title="Invoices"
            description="Create and manage invoices for clients"
            columns={invoiceColumns}
            data={invoiceCrud.data}
            loading={invoiceCrud.loading}
            fields={invoiceFields}
            schema={invoiceSchema}
            reportBadges={invoiceBadges}
            onCreate={(d) => invoiceCrud.create({
              ...d,
              status: "draft",
              items: [],
              paidAmount: 0,
              outstandingAmount: d.total,
              discount: d.discount ?? 0,
              tax: d.tax ?? 0,
            })}
            onUpdate={(id, d) => invoiceCrud.update(id, d)}
            onDelete={(id) => invoiceCrud.remove(id)}
            addLabel="+ New Invoice"
            nameKey="invoiceNumber"
          />
          <StatusPicker
            open={statusInvoice !== null}
            onClose={() => setStatusInvoice(null)}
            title={`Update Status — ${statusInvoice?.invoiceNumber ?? ""}`}
            currentStatus={statusInvoice?.status ?? ""}
            options={invStatusOptions}
            onSelect={async (newStatus) => {
              if (!statusInvoice) return;
              const body: Record<string, unknown> = { status: newStatus };
              if (newStatus === "paid") body.paidAt = new Date().toISOString();
              await invoiceCrud.update(statusInvoice._id, body);
              setStatusInvoice(null);
            }}
            isLoading={false}
          />
        </>
      )}

      {/* ═══ PAYMENTS ═══ */}
      {subTab === "payments" && (
        <CrudTab
          title="Payments"
          description="Record payments received against invoices"
          columns={paymentColumns}
          data={paymentCrud.data}
          loading={paymentCrud.loading}
          fields={paymentFields}
          schema={paymentSchema}
          onCreate={(d) => paymentCrud.create(d)}
          onUpdate={(id, d) => paymentCrud.update(id, d)}
          onDelete={(id) => paymentCrud.remove(id)}
          addLabel="+ Record Payment"
          nameKey="reference"
        />
      )}

      {/* ═══ OPERATIONAL COSTS ═══ */}
      {subTab === "operational" && (
        <CrudTab
          title="Operational Expenses"
          description="Rent, utilities, salaries, and other overhead costs not tied to projects"
          columns={opExpenseColumns}
          data={opExpenseCrud.data}
          loading={opExpenseCrud.loading}
          fields={opExpenseFields}
          schema={opExpenseSchema}
          onCreate={(d) => opExpenseCrud.create(d)}
          onUpdate={(id, d) => opExpenseCrud.update(id, d)}
          onDelete={(id) => opExpenseCrud.remove(id)}
          addLabel="+ Add Expense"
          nameKey="description"
        />
      )}
    </div>
  );
}
