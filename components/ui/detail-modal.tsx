"use client";

import Modal from "./modal";
import Badge from "./badge";

export interface DetailField {
  label: string;
  value: unknown;
  type?: "text" | "date" | "currency" | "badge" | "tags" | "percentage" | "url" | "email";
  badgeVariant?: "default" | "primary" | "success" | "warning" | "destructive";
  colSpan?: 1 | 2;
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: DetailField[];
}

function formatValue(field: DetailField): React.ReactNode {
  const v = field.value;
  if (v == null || v === "") return <span className="text-muted">—</span>;

  switch (field.type) {
    case "date": {
      const d = new Date(String(v));
      return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
    case "currency": {
      const n = Number(v);
      if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B T";
      if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M T";
      if (n >= 1e3) return new Intl.NumberFormat().format(n) + " T";
      return n + " T";
    }
    case "badge":
      return (
        <Badge variant={field.badgeVariant ?? "default"}>
          {String(v).replace(/_/g, " ")}
        </Badge>
      );
    case "tags": {
      const tags = Array.isArray(v) ? v : String(v).split(",").filter(Boolean);
      if (tags.length === 0) return <span className="text-muted">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((t: string) => (
            <span key={t} className="bg-muted-bg text-foreground rounded-full px-2.5 py-0.5 text-[12px] font-medium">{t}</span>
          ))}
        </div>
      );
    }
    case "percentage":
      return `${v}%`;
    case "url":
      return (
        <a href={String(v)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[14px]">
          {String(v).replace(/^https?:\/\//, "")}
        </a>
      );
    case "email":
      return (
        <a href={`mailto:${v}`} className="text-primary hover:underline text-[14px]">
          {String(v)}
        </a>
      );
    default:
      return <span className="text-[14px] text-foreground">{String(v)}</span>;
  }
}

export default function DetailModal({ open, onClose, title, subtitle, fields }: DetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={subtitle} size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
        {fields.map((f) => (
          <div key={f.label} className={f.colSpan === 2 ? "col-span-full" : ""}>
            <p className="text-[12px] font-medium text-muted uppercase tracking-wider mb-1">{f.label}</p>
            <div className="text-[14px] text-foreground">{formatValue(f)}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
