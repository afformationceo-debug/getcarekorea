"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  onClear?: () => void;
  showClearButton?: boolean;
  containerClassName?: string;
}

function SearchInput({
  className,
  containerClassName,
  onClear,
  showClearButton = true,
  value,
  onChange,
  ...props
}: SearchInputProps) {
  const hasValue = value && String(value).length > 0;

  return (
    <div className={cn("relative", containerClassName)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        className={cn(
          "pl-10 pr-10 h-12 rounded-xl border-2 border-primary/20 focus-visible:ring-4",
          className
        )}
        value={value}
        onChange={onChange}
        {...props}
      />
      {showClearButton && hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

export { SearchInput };
