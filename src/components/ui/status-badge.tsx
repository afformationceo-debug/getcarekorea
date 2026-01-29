"use client";

import * as React from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Archive,
  XCircle,
  Loader2,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export type StatusType =
  | "draft"
  | "review"
  | "pending"
  | "published"
  | "archived"
  | "cancelled"
  | "error"
  | "processing"
  | "generating"
  | "generated";

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const defaultStatusConfig: Record<
  StatusType,
  { icon: LucideIcon; variant: BadgeVariant; label: string }
> = {
  draft: { icon: Clock, variant: "secondary", label: "Draft" },
  review: { icon: AlertCircle, variant: "outline", label: "Review" },
  pending: { icon: Clock, variant: "secondary", label: "Pending" },
  published: { icon: CheckCircle, variant: "default", label: "Published" },
  archived: { icon: Archive, variant: "secondary", label: "Archived" },
  cancelled: { icon: XCircle, variant: "destructive", label: "Cancelled" },
  error: { icon: XCircle, variant: "destructive", label: "Error" },
  processing: { icon: Loader2, variant: "outline", label: "Processing" },
  generating: { icon: Loader2, variant: "default", label: "Generating" },
  generated: { icon: CheckCircle, variant: "outline", label: "Generated" },
};

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  showIcon?: boolean;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  className?: string;
  iconClassName?: string;
}

function StatusBadge({
  status,
  label,
  showIcon = true,
  variant,
  icon,
  className,
  iconClassName,
}: StatusBadgeProps) {
  const config = defaultStatusConfig[status as StatusType] || {
    icon: AlertCircle,
    variant: "secondary" as BadgeVariant,
    label: status,
  };

  const Icon = icon || config.icon;
  const badgeVariant = variant || config.variant;
  const displayLabel = label || config.label;
  const isProcessing = status === "processing" || status === "generating";

  return (
    <Badge variant={badgeVariant} className={cn("gap-1.5", className)}>
      {showIcon && (
        <Icon
          className={cn(
            "h-3 w-3",
            isProcessing && "animate-spin",
            iconClassName
          )}
        />
      )}
      <span className="capitalize">{displayLabel}</span>
    </Badge>
  );
}

// For custom status mappings
export interface CustomStatusConfig {
  [key: string]: {
    icon?: LucideIcon;
    variant?: BadgeVariant;
    label?: string;
  };
}

export interface StatusBadgeWithConfigProps extends Omit<StatusBadgeProps, "status"> {
  status: string;
  config: CustomStatusConfig;
}

function StatusBadgeWithConfig({
  status,
  config,
  ...props
}: StatusBadgeWithConfigProps) {
  const statusConfig = config[status] || {};
  return (
    <StatusBadge
      status={status}
      variant={statusConfig.variant}
      icon={statusConfig.icon}
      label={statusConfig.label}
      {...props}
    />
  );
}

export { StatusBadge, StatusBadgeWithConfig };
