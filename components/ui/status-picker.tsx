"use client";

import Modal from "./modal";

export interface StatusOption {
  value: string;
  label: string;
  variant: "default" | "primary" | "success" | "warning" | "destructive";
}

interface StatusPickerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  currentStatus: string;
  options: StatusOption[];
  onSelect: (status: string) => void;
  isLoading?: boolean;
}

const variantBg: Record<string, string> = {
  default: "bg-muted-bg hover:bg-muted-bg/80 border-separator text-foreground",
  primary: "bg-primary/8 hover:bg-primary/15 border-primary/20 text-primary",
  success: "bg-success/8 hover:bg-success/15 border-success/20 text-success",
  warning: "bg-warning/8 hover:bg-warning/15 border-warning/20 text-warning",
  destructive: "bg-destructive/8 hover:bg-destructive/15 border-destructive/20 text-destructive",
};

const activeBg: Record<string, string> = {
  default: "ring-2 ring-foreground/30",
  primary: "ring-2 ring-primary",
  success: "ring-2 ring-success",
  warning: "ring-2 ring-warning",
  destructive: "ring-2 ring-destructive",
};

export default function StatusPicker({ open, onClose, title, currentStatus, options, onSelect, isLoading }: StatusPickerProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-2 mt-2">
        {options.map((opt) => {
          const isCurrent = opt.value === currentStatus;
          return (
            <button
              key={opt.value}
              disabled={isCurrent || isLoading}
              onClick={() => onSelect(opt.value)}
              className={`flex items-center justify-between px-4 py-3 rounded-[var(--radius-sm)] border text-[14px] font-medium transition-all duration-200 disabled:cursor-not-allowed ${variantBg[opt.variant]} ${isCurrent ? activeBg[opt.variant] : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? "bg-current" : "bg-current opacity-40"}`} />
                <span>{opt.label}</span>
              </div>
              {isCurrent && (
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-60">Current</span>
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
