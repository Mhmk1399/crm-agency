"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--card)",
          color: "var(--foreground)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.12)",
          borderRadius: "var(--radius-sm)",
          fontSize: "14px",
          fontWeight: 500,
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "var(--success)",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--destructive)",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
