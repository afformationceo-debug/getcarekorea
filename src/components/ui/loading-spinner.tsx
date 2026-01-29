"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "primary" | "secondary" | "white" | "muted";
}

const sizeClasses = {
  xs: "h-3 w-3 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
  xl: "h-12 w-12 border-4",
};

const colorClasses = {
  primary: "border-primary/30 border-t-primary",
  secondary: "border-violet-200 border-t-violet-600",
  white: "border-white/30 border-t-white",
  muted: "border-muted-foreground/30 border-t-muted-foreground",
};

function LoadingSpinner({
  size = "md",
  color = "primary",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Full page loading overlay
export interface PageLoadingProps {
  text?: string;
  className?: string;
}

function PageLoading({ text, className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <LoadingSpinner size="xl" color="secondary" />
      {text && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Inline loading for sections/cards
export interface SectionLoadingProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function SectionLoading({ text, className, size = "lg" }: SectionLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12",
        className
      )}
    >
      <LoadingSpinner size={size} color="secondary" />
      {text && (
        <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

// Button loading spinner (smaller, inline)
function ButtonSpinner({ className }: { className?: string }) {
  return <LoadingSpinner size="sm" color="white" className={className} />;
}

export { LoadingSpinner, PageLoading, SectionLoading, ButtonSpinner };
