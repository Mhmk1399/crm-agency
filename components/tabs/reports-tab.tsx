"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DynamicTable from "@/components/ui/dynamic-table";
import DynamicSelect from "@/components/ui/dynamic-select";
import DatePicker, { type DateRangeValue } from "@/components/ui/date-picker";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import toast from "@/components/ui/toast";
import type { ReportColumn, ReportResource } from "@/lib/report-definitions";
import type { ColumnConfig } from "@/types/dynamic-table";

interface ReportResponse {
  resources: ReportResource[];
  resource: ReportResource;
  rows: ReportRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  numericSummaries: Record<string, number | string | null>;
  grouped: { _id: string | boolean | null; count: number }[];
}

interface ReportRow {
  _id: string;
  [key: string]: unknown;
}

type SortDirection = "asc" | "desc";

export default function ReportsTab() {
  const [selectedResource, setSelectedResource] = useState("");
  const [search, setSearch] = useState("");
  const [dateField, setDateField] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({});
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [metricField, setMetricField] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<SortDirection>("desc");

  const query = useQuery<ReportResponse>({
    queryKey: [
      "reports",
      selectedResource,
      search,
      dateField,
      dateRange.from,
      dateRange.to,
      filterValues,
      metricField,
      minValue,
      maxValue,
      sort,
      order,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedResource) params.set("resource", selectedResource);
      if (search.trim()) params.set("search", search.trim());
      if (dateField) params.set("dateField", dateField);
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      if (metricField && minValue.trim()) params.set(`min_${metricField}`, minValue.trim());
      if (metricField && maxValue.trim()) params.set(`max_${metricField}`, maxValue.trim());
      params.set("sort", sort);
      params.set("order", order);
      Object.entries(filterValues).forEach(([key, value]) => {
        if (value) params.set(`f_${key}`, value);
      });

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load reports");
      return json.data;
    },
    placeholderData: (previous) => previous,
  });

  const resource = query.data?.resource;
  const resources = useMemo(() => query.data?.resources ?? [], [query.data?.resources]);
  const selectedDateField = dateField || resource?.dateFields[0]?.value || "";
  const selectedMetric = metricField || resource?.numericFields[0]?.value || "";

  const resourceOptions = useMemo(
    () => resources.map((item) => ({ label: item.label, value: item.id, description: item.description })),
    [resources],
  );

  const columns = useMemo<ColumnConfig<ReportRow>[]>(() => {
    if (!resource) return [];
    return resource.columns.map((column) => ({
      key: column.key,
      label: column.label,
      sortable: true,
      hideOnMobile: column.type === "date" || column.type === "currency",
      align: column.type === "number" || column.type === "currency" ? "right" : "left",
      render: (value) => renderCell(value, column),
    }));
  }, [resource]);

  function resetFilters(nextResource?: string) {
    setSelectedResource(nextResource ?? selectedResource);
    setSearch("");
    setDateField("");
    setDateRange({});
    setFilterValues({});
    setMetricField("");
    setMinValue("");
    setMaxValue("");
    setSort("createdAt");
    setOrder("desc");
  }

  function exportCsv() {
    if (!resource || !query.data?.rows.length) {
      toast.error("No report rows to export.");
      return;
    }

    const csv = [
      resource.columns.map((column) => quoteCsv(column.label)).join(","),
      ...query.data.rows.map((row) =>
        resource.columns.map((column) => quoteCsv(formatRawValue(row[column.key], column))).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resource.id}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-[14px] text-muted">
            Filter, inspect, and export operational data across the CRM.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={exportCsv} disabled={!query.data?.rows.length}>
          Export CSV
        </Button>
      </div>

      <div className="glass rounded-[var(--radius-lg)] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <FilterBlock label="Report">
            <DynamicSelect
              options={resourceOptions}
              value={selectedResource || resource?.id || ""}
              onChange={(value) => resetFilters(value)}
              placeholder="Select report"
              searchPlaceholder="Search reports..."
              isLoading={query.isLoading && resources.length === 0}
              getOptionDescription={(option) => option.description}
            />
          </FilterBlock>

          <FilterBlock label="Search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${resource?.label.toLowerCase() ?? "records"}...`}
              className="min-h-12 w-full min-w-0 rounded-[var(--radius-sm)] border border-input-border bg-input-bg px-4 py-3 text-base text-foreground outline-none transition-all duration-200 placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-input-focus"
            />
          </FilterBlock>

          <FilterBlock label="Date Field">
            <DynamicSelect
              options={resource?.dateFields ?? []}
              value={selectedDateField}
              onChange={setDateField}
              placeholder="Date field"
            />
          </FilterBlock>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <FilterBlock label="Date Range">
            <DatePicker
              mode="range"
              rangeValue={dateRange}
              onRangeChange={setDateRange}
              placeholder="Select date range"
            />
          </FilterBlock>

          <FilterBlock label="Numeric Filter">
            <DynamicSelect
              options={resource?.numericFields ?? []}
              value={selectedMetric}
              onChange={setMetricField}
              placeholder="Metric"
              disabled={!resource?.numericFields.length}
            />
          </FilterBlock>

          <div className="grid grid-cols-2 gap-3">
            <FilterBlock label="Min">
              <input
                value={minValue}
                onChange={(event) => setMinValue(event.target.value)}
                type="number"
                placeholder="Any"
                disabled={!resource?.numericFields.length}
                className="min-h-12 w-full min-w-0 rounded-[var(--radius-sm)] border border-input-border bg-input-bg px-4 py-3 text-base text-foreground outline-none transition-all duration-200 placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-input-focus disabled:opacity-40"
              />
            </FilterBlock>
            <FilterBlock label="Max">
              <input
                value={maxValue}
                onChange={(event) => setMaxValue(event.target.value)}
                type="number"
                placeholder="Any"
                disabled={!resource?.numericFields.length}
                className="min-h-12 w-full min-w-0 rounded-[var(--radius-sm)] border border-input-border bg-input-bg px-4 py-3 text-base text-foreground outline-none transition-all duration-200 placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-input-focus disabled:opacity-40"
              />
            </FilterBlock>
          </div>
        </div>

        {resource && resource.filters.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {resource.filters.map((filter) => (
              <FilterBlock key={filter.key} label={filter.label}>
                <DynamicSelect
                  options={[{ label: "All", value: "" }, ...(filter.options ?? [])]}
                  value={filterValues[filter.key] ?? ""}
                  onChange={(value) => setFilterValues((current) => ({ ...current, [filter.key]: value }))}
                  placeholder={`All ${filter.label.toLowerCase()}`}
                />
              </FilterBlock>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            <Badge>{query.data?.total ?? 0} records</Badge>
            {dateRange.from && <Badge variant="primary">From {dateRange.from}</Badge>}
            {dateRange.to && <Badge variant="primary">To {dateRange.to}</Badge>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOrder((current) => (current === "desc" ? "asc" : "desc"))}
              className="rounded-[var(--radius-sm)] border border-input-border bg-input-bg px-4 py-2.5 text-[13px] font-semibold text-foreground transition-all hover:bg-muted-bg"
            >
              {order === "desc" ? "Newest" : "Oldest"}
            </button>
            <button
              type="button"
              onClick={() => resetFilters()}
              className="rounded-[var(--radius-sm)] border border-input-border bg-input-bg px-4 py-2.5 text-[13px] font-semibold text-red-500 transition-all hover:bg-red-500 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {query.isError && (
        <div className="rounded-[var(--radius)] border border-destructive/20 bg-destructive/8 p-4 text-[14px] text-destructive">
          {query.error.message}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SummaryPanel resource={resource} data={query.data} loading={query.isLoading} />
        <BreakdownPanel resource={resource} data={query.data} loading={query.isLoading} />
      </div>

      <DynamicTable
        title={resource ? `${resource.label} Results` : "Report Results"}
        description={resource?.description ?? "Choose a report to load data"}
        columns={columns}
        data={query.data?.rows ?? []}
        isLoading={query.isLoading || query.isFetching}
        searchable={false}
        pageSize={25}
        emptyMessage="No records match these filters."
      />
    </div>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="px-1 text-[12px] font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

function SummaryPanel({ resource, data, loading }: { resource?: ReportResource; data?: ReportResponse; loading: boolean }) {
  const metrics = resource?.numericFields.slice(0, 6) ?? [];
  return (
    <div className="glass rounded-[var(--radius-lg)] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-foreground">Summary</h2>
        <p className="text-[12px] text-muted">Totals and averages for the selected report</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricTile label="Records" value={loading ? "" : formatNumber(data?.total ?? 0)} loading={loading} />
        {metrics.map((metric) => (
          <MetricTile
            key={metric.value}
            label={`${metric.label} Sum`}
            value={formatNumber(Number(data?.numericSummaries?.[`${metric.value}Sum`] ?? 0))}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}

function BreakdownPanel({ resource, data, loading }: { resource?: ReportResource; data?: ReportResponse; loading: boolean }) {
  const total = data?.grouped.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const label = resource?.filters[0]?.label ?? "Group";

  return (
    <div className="glass rounded-[var(--radius-lg)] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-foreground">Breakdown</h2>
        <p className="text-[12px] text-muted">Grouped by {label.toLowerCase()}</p>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-8 animate-pulse rounded-lg bg-muted-bg" />
          ))}
        </div>
      ) : data?.grouped.length ? (
        <div className="space-y-3">
          {data.grouped.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={String(item._id)} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] font-medium capitalize text-foreground">
                    {String(item._id ?? "empty").replace(/_/g, " ")}
                  </span>
                  <span className="text-[12px] font-semibold text-muted">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted-bg">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-8 text-center text-[13px] text-muted">No grouped data</p>
      )}
    </div>
  );
}

function MetricTile({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-separator bg-background/35 p-3">
      <p className="truncate text-[11px] font-semibold uppercase text-muted">{label}</p>
      {loading ? (
        <div className="mt-3 h-6 w-20 animate-pulse rounded-full bg-muted-bg" />
      ) : (
        <p className="mt-2 truncate text-[20px] font-bold text-foreground">{value}</p>
      )}
    </div>
  );
}

function renderCell(value: unknown, column: ReportColumn) {
  if (column.type === "boolean") return <Badge variant={value ? "success" : "default"}>{value ? "Yes" : "No"}</Badge>;
  if (column.type === "date") return value ? new Date(String(value)).toLocaleDateString() : <span className="text-muted">-</span>;
  if (column.type === "currency" || column.type === "number") return formatNumber(Number(value ?? 0));
  if (column.type === "select") return <Badge>{String(value ?? "-").replace(/_/g, " ")}</Badge>;
  return value == null || value === "" ? <span className="text-muted">-</span> : String(value);
}

function formatRawValue(value: unknown, column: ReportColumn) {
  if (column.type === "date" && value) return new Date(String(value)).toISOString();
  if (typeof value === "object" && value !== null && "_id" in value) return String(value._id);
  return value == null ? "" : String(value);
}

function quoteCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}
