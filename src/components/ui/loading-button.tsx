"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LoadingSpinner } from "./loading-spinner";

export interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
}

function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={isLoading || disabled}
      className={cn("gap-2", className)}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" color="white" />}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
}

export { LoadingButton };
