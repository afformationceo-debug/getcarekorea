"use client";

import * as React from "react";
import { Eye, Pencil, Trash2, MoreHorizontal, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "ghost" | "outline" | "destructive";
  disabled?: boolean;
  className?: string;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
  disabled = false,
  className,
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn("h-8 w-8 p-0", className)}
      title={label}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

export interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  customActions?: ActionButtonProps[];
  showAsDropdown?: boolean;
  disabled?: boolean;
  className?: string;
}

function ActionButtons({
  onView,
  onEdit,
  onDelete,
  customActions = [],
  showAsDropdown = false,
  disabled = false,
  className,
}: ActionButtonsProps) {
  const actions: ActionButtonProps[] = [
    ...(onView
      ? [{ icon: Eye, label: "View", onClick: onView, variant: "ghost" as const }]
      : []),
    ...(onEdit
      ? [{ icon: Pencil, label: "Edit", onClick: onEdit, variant: "ghost" as const }]
      : []),
    ...(onDelete
      ? [
          {
            icon: Trash2,
            label: "Delete",
            onClick: onDelete,
            variant: "ghost" as const,
            className: "text-destructive hover:text-destructive",
          },
        ]
      : []),
    ...customActions,
  ];

  if (actions.length === 0) return null;

  if (showAsDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", className)}
            disabled={disabled}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.className}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {actions.map((action, index) => (
        <ActionButton key={index} {...action} disabled={disabled || action.disabled} />
      ))}
    </div>
  );
}

export { ActionButton, ActionButtons };
