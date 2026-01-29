"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { LucideIcon } from "lucide-react";

export interface IconInputProps extends React.ComponentProps<"input"> {
  icon: LucideIcon;
  iconClassName?: string;
  containerClassName?: string;
  rightElement?: React.ReactNode;
}

function IconInput({
  icon: Icon,
  iconClassName,
  containerClassName,
  rightElement,
  className,
  ...props
}: IconInputProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <Icon
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none",
          iconClassName
        )}
      />
      <Input
        className={cn(
          "pl-10",
          rightElement && "pr-10",
          className
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
}

export { IconInput };
