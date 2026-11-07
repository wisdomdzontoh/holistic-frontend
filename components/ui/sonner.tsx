"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * App toasts: solid tinted cards (success / error / info / warning), bottom-right.
 * Colours come from the --toast-* aliases in globals.css. Never set Sonner's
 * variables to hsl(var(--success-bg)) etc. directly — those names are our own
 * tokens too, so it would reference itself and render the toast transparent.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      className="toaster group"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border font-sans !shadow-[0_8px_24px_hsl(213_55%_16%/0.12)]",
          title: "!text-sm !font-semibold",
          description: "!text-sm !opacity-90",
          closeButton: "!border-border !bg-card !text-muted-foreground hover:!text-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--toast-normal-bg)",
          "--normal-text": "var(--toast-normal-text)",
          "--normal-border": "var(--toast-normal-border)",
          "--success-bg": "var(--toast-success-bg)",
          "--success-text": "var(--toast-success-text)",
          "--success-border": "var(--toast-success-border)",
          "--error-bg": "var(--toast-error-bg)",
          "--error-text": "var(--toast-error-text)",
          "--error-border": "var(--toast-error-border)",
          "--info-bg": "var(--toast-info-bg)",
          "--info-text": "var(--toast-info-text)",
          "--info-border": "var(--toast-info-border)",
          "--warning-bg": "var(--toast-warning-bg)",
          "--warning-text": "var(--toast-warning-text)",
          "--warning-border": "var(--toast-warning-border)",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
