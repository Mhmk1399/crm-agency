"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  DynamicTableProps,
  SortState,
  ColumnConfig,
} from "@/types/dynamic-table";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={direction === "up" ? "rotate-180" : ""}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {icon ?? (
        <div className="h-12 w-12 rounded-full bg-muted-bg flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      )}
      <p className="text-[15px] text-muted">{message}</p>
    </div>
  );
}

function LoadingSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-4 rounded-md bg-muted-bg animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DynamicTable<T extends { _id?: string; id?: string }>({
  columns, data, actions, onRowClick,
  searchable = true, searchPlaceholder = "Search...",
  pageSize = 10, emptyMessage = "No data found", emptyIcon,
  isLoading = false, title, description, headerAction,
}: DynamicTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(0);

  const searchableKeys = useMemo(() => columns.filter((c) => c.searchable !== false).map((c) => c.key), [columns]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) => searchableKeys.some((key) => { const val = row[key]; return val != null && String(val).toLowerCase().includes(q); }));
  }, [data, search, searchableKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, direction } = sort;
    return [...filtered].sort((a, b) => {
      const aVal = a[key as keyof T]; const bVal = b[key as keyof T];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1; if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") return direction === "asc" ? aVal - bVal : bVal - aVal;
      return direction === "asc" ? String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase()) : String(bVal).toLowerCase().localeCompare(String(aVal).toLowerCase());
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safeCurrentPage * pageSize, (safeCurrentPage + 1) * pageSize);

  const handleSort = useCallback((col: ColumnConfig<T>) => {
    if (!col.sortable) return;
    setSort((prev) => {
      if (prev?.key === col.key) { if (prev.direction === "asc") return { key: col.key, direction: "desc" }; return null; }
      return { key: col.key, direction: "asc" };
    });
  }, []);

  const getRowKey = (row: T, index: number): string => row._id ?? row.id ?? String(index);
  const hasActions = actions && actions.length > 0;

  const thAlign = (col: ColumnConfig<T>) =>
    col.align === "right" ? "text-right justify-end" : col.align === "center" ? "text-center justify-center" : "text-left justify-start";

  const tdAlign = (col: ColumnConfig<T>) =>
    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";

  return (
    <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header */}
      {(title || description || searchable || headerAction) && (
        <div className="px-6 pt-6 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-[14px] text-muted">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><SearchIcon /></span>
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder={searchPlaceholder}
                  className="w-full sm:w-64 rounded-[var(--radius-sm)] bg-input-bg pl-9 pr-4 py-2.5 text-[14px] text-foreground border border-input-border outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-input-focus transition-all duration-200" />
              </div>
            )}
            {headerAction}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--background)] border-y-2 border-separator">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  style={{ width: col.width }}
                  className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted/80 whitespace-nowrap ${
                    col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""
                  } ${col.hideOnMobile ? "hidden sm:table-cell" : ""} ${tdAlign(col)}`}
                >
                  <span className={`inline-flex items-center gap-1.5 ${thAlign(col)}`}>
                    {col.label}
                    {col.sortable && sort?.key === col.key && <ChevronIcon direction={sort.direction === "asc" ? "up" : "down"} />}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted/80" style={{ width: "auto" }} />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {isLoading ? (
              <LoadingSkeleton columns={columns.length + (hasActions ? 1 : 0)} />
            ) : paged.length === 0 ? (
              <tr><td colSpan={columns.length + (hasActions ? 1 : 0)}><EmptyState message={emptyMessage} icon={emptyIcon} /></td></tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={getRowKey(row, i)}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors duration-150 ${onRowClick ? "cursor-pointer hover:bg-muted-bg" : "hover:bg-muted-bg/50"}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 text-[14px] text-foreground whitespace-nowrap ${
                        col.hideOnMobile ? "hidden sm:table-cell" : ""
                      } ${tdAlign(col)}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key] == null ? "—" : String(row[col.key])}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5">
                        {actions!
                          .filter((a) => !a.show || a.show(row))
                          .map((action) => (
                            <button
                              key={action.label}
                              onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
                              title={action.label}
                              className={`rounded-lg p-2 transition-all duration-200 ${
                                action.variant === "destructive"
                                  ? "text-muted hover:text-destructive hover:bg-destructive/10"
                                  : "text-muted hover:text-primary hover:bg-primary/10"
                              }`}
                            >
                              {action.icon ?? <span className="text-[12px] font-medium">{action.label}</span>}
                            </button>
                          ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-separator flex items-center justify-between">
          <p className="text-[13px] text-muted">
            {sorted.length === 0 ? "No results" : `${safeCurrentPage * pageSize + 1}–${Math.min((safeCurrentPage + 1) * pageSize, sorted.length)} of ${sorted.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safeCurrentPage === 0}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-foreground bg-input-bg border border-input-border hover:bg-muted-bg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i;
              else if (safeCurrentPage < 3) pageNum = i;
              else if (safeCurrentPage > totalPages - 4) pageNum = totalPages - 5 + i;
              else pageNum = safeCurrentPage - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200 min-w-[36px] ${safeCurrentPage === pageNum ? "bg-primary text-white shadow-sm" : "text-foreground hover:bg-muted-bg"}`}>
                  {pageNum + 1}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safeCurrentPage === totalPages - 1}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-foreground bg-input-bg border border-input-border hover:bg-muted-bg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
