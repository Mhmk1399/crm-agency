"use client";

import { useEffect, useRef, useCallback } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    },
    [isLoading, onCancel]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current && !isLoading) onCancel();
      }}
      className="fixed inset-0 z-[60] flex items-stretch justify-center overflow-hidden bg-black/30 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="glass flex h-dvh w-screen max-w-none flex-col justify-center overflow-hidden rounded-none border-0 p-6 text-center shadow-xl sm:h-auto sm:max-w-sm sm:rounded-[var(--radius-lg)] sm:border">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full flex shrink-0 items-center justify-center bg-destructive/12">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--destructive)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h3 className="break-words text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 break-words text-[14px] text-muted leading-relaxed">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full rounded-[var(--radius-sm)] px-4 py-2.5 text-[15px] font-medium text-foreground bg-input-bg border border-input-border hover:bg-muted-bg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1 ${
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive-hover"
                : "bg-primary hover:bg-primary-hover"
            }`}
            type="button"
          >
            {isLoading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isLoading ? "Logging out..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
