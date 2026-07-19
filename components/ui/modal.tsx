"use client";

import { useEffect, useRef, useCallback } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
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
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-black/30 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4"
    >
      <div
        className={`glass flex h-dvh w-screen min-w-0 max-w-none flex-col overflow-hidden rounded-none border-0 shadow-xl sm:h-auto sm:max-h-[90vh] sm:w-full sm:rounded-[var(--radius-lg)] sm:border ${sizeClasses[size]}`}
      >
        {(title || description) && (
          <div className="sticky top-0 z-20 flex shrink-0 items-start justify-between gap-3 border-b border-separator bg-card/95 px-4 py-4 backdrop-blur-[var(--blur)] sm:px-6 sm:py-5">
            <div className="min-w-0">
              {title && (
                <h3 className="break-words text-[18px] font-semibold leading-snug text-foreground">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-0.5 break-words text-[14px] text-muted">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-all duration-200"
              aria-label="Close modal"
              type="button"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="modal-body dynamic-table-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
