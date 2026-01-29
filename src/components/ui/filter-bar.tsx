"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SearchInput, SearchInputProps } from "./search-input";

export interface FilterBarProps {
  searchProps?: SearchInputProps;
  children?: React.ReactNode;
  className?: string;
}

function FilterBar({ searchProps, children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-4 items-stretch sm:items-center",
        className
      )}
    >
      {searchProps && (
        <div className="flex-1">
          <SearchInput {...searchProps} />
        </div>
      )}
      {children && (
        <div className="flex flex-wrap gap-2 sm:gap-4">{children}</div>
      )}
    </div>
  );
}

export { FilterBar };
