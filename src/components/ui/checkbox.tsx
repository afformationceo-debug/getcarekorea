"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps {
  checked?: boolean;
  onChange?: () => void;
  onCheckedChange?: () => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
  ({ checked, onChange, onCheckedChange, disabled, className }, ref) => {
    const handleChange = onChange || onCheckedChange;
    return (
      <div
        ref={ref}
        role="checkbox"
        aria-checked={checked}
        onClick={disabled ? undefined : handleChange}
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary",
          "flex items-center justify-center cursor-pointer transition-colors",
          checked && "bg-primary text-primary-foreground",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "hover:border-primary/80",
          className
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
