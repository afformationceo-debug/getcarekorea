"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LoadingSpinner } from "./loading-spinner";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  disabled?: boolean;
  previousLabel?: string;
  nextLabel?: string;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = false,
  showPageNumbers = true,
  maxPageNumbers = 5,
  disabled = false,
  previousLabel = "Previous",
  nextLabel = "Next",
}: PaginationProps) {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Calculate page numbers to show
  const getPageNumbers = (): number[] => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPageNumbers / 2);
    let start = currentPage - half;
    let end = currentPage + half;

    if (start < 1) {
      start = 1;
      end = maxPageNumbers;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - maxPageNumbers + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {showFirstLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={disabled || isFirstPage}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || isFirstPage}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{previousLabel}</span>
      </Button>

      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              {pageNum}
            </Button>
          ))}
        </div>
      )}

      {!showPageNumbers && (
        <span className="text-sm text-muted-foreground px-2">
          Page {currentPage} of {totalPages}
        </span>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || isLastPage}
        className="gap-1"
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showFirstLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || isLastPage}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      )}
    </div>
  );
}

// Simple pagination info display
export interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className,
}: PaginationInfoProps) {
  if (totalItems && itemsPerPage) {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Showing {start}-{end} of {totalItems}
      </span>
    );
  }

  return (
    <span className={cn("text-sm text-muted-foreground", className)}>
      Page {currentPage} of {totalPages}
    </span>
  );
}

// Load more button variant
export interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  hasMore: boolean;
  loadingLabel?: string;
  label?: string;
  className?: string;
}

function LoadMoreButton({
  onClick,
  isLoading = false,
  hasMore,
  loadingLabel = "Loading...",
  label = "Load More",
  className,
}: LoadMoreButtonProps) {
  if (!hasMore) return null;

  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={isLoading}
      className={cn("w-full", className)}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export { Pagination, PaginationInfo, LoadMoreButton };
