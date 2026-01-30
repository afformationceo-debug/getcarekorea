"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <LoadingSpinner size="sm" />,
      }}
      toastOptions={{
        classNames: {
          toast: '[&]:border',
          success: '[&]:bg-[#ecfdf3] [&]:text-[#008a2e] [&]:border-[#008a2e]/20',
          error: '[&]:bg-[#fff0f0] [&]:text-[#e60000] [&]:border-[#e60000]/20',
          warning: '[&]:bg-[#fffcf0] [&]:text-[#dc7609] [&]:border-[#dc7609]/20',
          info: '[&]:bg-[#f0f8ff] [&]:text-[#0973dc] [&]:border-[#0973dc]/20',
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#000000",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
