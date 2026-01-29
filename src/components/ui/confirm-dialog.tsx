"use client";

import * as React from "react";
import { Trash2, AlertTriangle, LucideIcon } from "lucide-react";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

export type ConfirmDialogVariant = "destructive" | "warning" | "default";

const variantConfig: Record<
  ConfirmDialogVariant,
  { icon: LucideIcon; iconColor: string; buttonVariant: "destructive" | "default" }
> = {
  destructive: {
    icon: Trash2,
    iconColor: "text-red-600",
    buttonVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    buttonVariant: "default",
  },
  default: {
    icon: AlertTriangle,
    iconColor: "text-primary",
    buttonVariant: "default",
  },
};

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: ConfirmDialogVariant;
  icon?: LucideIcon;
  isLoading?: boolean;
  loadingLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  icon,
  isLoading = false,
  loadingLabel,
  children,
  className,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", config.iconColor)}>
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children && <div className="py-4">{children}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                {loadingLabel || confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Preset for delete confirmation
export interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemDescription?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

function DeleteDialog({
  open,
  onOpenChange,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  itemDescription,
  onConfirm,
  isLoading = false,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
      loadingLabel="Deleting..."
    >
      {(itemName || itemDescription) && (
        <div className="p-4 bg-muted rounded-lg">
          {itemName && <p className="font-medium">{itemName}</p>}
          {itemDescription && (
            <p className="text-sm text-muted-foreground">{itemDescription}</p>
          )}
        </div>
      )}
    </ConfirmDialog>
  );
}

export { ConfirmDialog, DeleteDialog };
