"use client";

import hotToast, { Toaster, type ToastOptions } from "react-hot-toast";

type ToastVariant = "success" | "error" | "info" | "warning";
type ToastMessage = React.ReactNode;

const variantConfig = {
  success: {
    label: "Success",
    color: "var(--success)",
    duration: 3000,
    icon: (
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    ),
  },
  error: {
    label: "Error",
    color: "var(--destructive)",
    duration: 4200,
    icon: (
      <>
        <path
          d="M18 6 6 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          d="m6 6 12 12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </>
    ),
  },
  info: {
    label: "Info",
    color: "var(--primary)",
    duration: 3600,
    icon: (
      <>
        <path
          d="M12 11v6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          d="M12 7h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </>
    ),
  },
  warning: {
    label: "Warning",
    color: "var(--warning)",
    duration: 4200,
    icon: (
      <>
        <path
          d="M12 9v4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          d="M12 17h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M10.3 4.2 2.8 17.4A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.6L13.7 4.2a2 2 0 0 0-3.4 0Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </>
    ),
  },
} as const;

function CustomToast({
  message,
  variant,
  visible,
}: {
  message: ToastMessage;
  variant: ToastVariant;
  visible: boolean;
}) {
  const config = variantConfig[variant];

  return (
    <div
      className={`pointer-events-auto flex w-[min(92vw,420px)] items-start gap-3 overflow-hidden rounded-[var(--radius-sm)] border border-card-border bg-card px-4 py-3 text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.14)] backdrop-blur-[var(--blur)] transition-all duration-200 ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "-translate-y-2 scale-95 opacity-0"
      }`}
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${config.color} 20%, var(--card)) 0%, color-mix(in srgb, ${config.color} 10%, var(--card)) 52%, var(--card) 100%)`,
        borderColor: `color-mix(in srgb, ${config.color} 28%, var(--card-border))`,
        borderLeft: `4px solid ${config.color}`,
      }}
    >
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `color-mix(in srgb, ${config.color} 18%, var(--card))`,
          color: config.color,
        }}
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          {config.icon}
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="text-[13px] font-semibold leading-4"
          style={{ color: config.color }}
        >
          {config.label}
        </p>
        <div className="mt-0.5 break-words text-[14px] font-medium leading-5 text-foreground">
          {message}
        </div>
      </div>
    </div>
  );
}

function showToast(
  variant: ToastVariant,
  message: ToastMessage,
  options?: ToastOptions,
) {
  const config = variantConfig[variant];

  return hotToast.custom(
    (toast) => (
      <CustomToast
        message={message}
        variant={variant}
        visible={toast.visible}
      />
    ),
    {
      duration: config.duration,
      ariaProps: {
        role: variant === "error" ? "alert" : "status",
        "aria-live": variant === "error" ? "assertive" : "polite",
      },
      ...options,
    },
  );
}

const toast = Object.assign(
  (message: ToastMessage, options?: ToastOptions) =>
    showToast("info", message, options),
  {
    success: (message: ToastMessage, options?: ToastOptions) =>
      showToast("success", message, options),
    error: (message: ToastMessage, options?: ToastOptions) =>
      showToast("error", message, options),
    info: (message: ToastMessage, options?: ToastOptions) =>
      showToast("info", message, options),
    warning: (message: ToastMessage, options?: ToastOptions) =>
      showToast("warning", message, options),
    custom: hotToast.custom,
    dismiss: hotToast.dismiss,
    dismissAll: hotToast.dismissAll,
    loading: hotToast.loading,
    promise: hotToast.promise,
    remove: hotToast.remove,
    removeAll: hotToast.removeAll,
  },
);

export function ToastProvider() {
  return (
    <Toaster
      gutter={5}
      
      position="top-center"
      toastOptions={{
        duration: 3600,
        removeDelay: 250,
      }}
    />
  );
}

export default toast;
