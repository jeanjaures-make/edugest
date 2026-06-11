"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          color: "#0f172a",
          fontSize: "14px",
        },
        className: "text-sm",
      }}
      closeButton
      richColors
    />
  )
}
