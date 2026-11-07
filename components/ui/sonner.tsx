"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      className="toaster group"
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border bg-card text-foreground font-sans",
          description: "text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--success-bg": "hsl(var(--success-bg))",
          "--success-text": "hsl(var(--success))",
          "--success-border": "hsl(var(--success-border))",
          "--error-bg": "hsl(var(--error-bg))",
          "--error-text": "hsl(var(--error))",
          "--error-border": "hsl(var(--error-border))",
          "--info-bg": "hsl(var(--info-bg))",
          "--info-text": "hsl(var(--info))",
          "--info-border": "hsl(var(--info-border))",
        } as React.CSSProperties
      }
      richColors
      {...props}
    />
  )
}

export { Toaster }
