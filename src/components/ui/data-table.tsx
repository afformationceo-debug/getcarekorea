'use client';

import { useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Constants
const DEFAULT_PAGE_SIZE = 40;

// Types
export interface ColumnDef<T> {
  id: string;
  header: string;
  headerClassName?: string;
  cell: (row: T) => ReactNode;
  cellClassName?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  id: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
}

export interface DataTableProps<T> {
  // Data
  data: T[];
  totalCount: number;
  columns: ColumnDef<T>[];

  // Identification
  getRowId: (row: T) => string;

  // Fetching
  fetchData: (page: number, filters: Record<string, string>) => Promise<{
    data: T[];
    total: number;
    hasMore: boolean;
  }>;

  // Filters
  filters?: FilterDef[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  showRefresh?: boolean;

  // UI
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;

  // Actions
  actions?: ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;

  // Page size
  pageSize?: number;
}

export function DataTable<T>({
  data: initialData,
  totalCount: initialTotal,
  columns,
  getRowId,
  fetchData,
  filters = [],
  searchPlaceholder = 'Search...',
  showSearch = true,
  showRefresh = true,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your filters',
  actions,
  onRowClick,
  rowClassName,
  pageSize = DEFAULT_PAGE_SIZE,
}: DataTableProps<T>) {
  // Data state
  const [data, setData] = useState<T[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialData.length < initialTotal);
  const [page, setPage] = useState(1);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter states
  const initialFilterState = useMemo(() => {
    const state: Record<string, string> = { search: '' };
    filters.forEach(f => {
      state[f.id] = f.defaultValue || 'all';
    });
    return state;
  }, [filters]);

  const [tempFilters, setTempFilters] = useState<Record<string, string>>(initialFilterState);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(initialFilterState);

  // Check if filters changed
  const filtersChanged = useMemo(() => {
    return JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters);
  }, [tempFilters, appliedFilters]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(appliedFilters).some(([key, value]) => {
      if (key === 'search') return value !== '';
      return value !== 'all';
    });
  }, [appliedFilters]);

  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Ref to prevent concurrent fetches (race condition fix)
  const isFetchingRef = useRef(false);

  // Fetch data
  const handleFetch = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await fetchData(pageNum, appliedFilters);

      if (append) {
        // Deduplicate data by ID to prevent duplicate key errors
        setData(prev => {
          const existingIds = new Set(prev.map(item => getRowId(item)));
          const newItems = result.data.filter((item: T) => !existingIds.has(getRowId(item)));
          return [...prev, ...newItems];
        });
      } else {
        setData(result.data);
      }

      setTotalCount(result.total);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [appliedFilters, fetchData, getRowId]);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    isFetchingRef.current = false; // Reset fetching state
    setAppliedFilters({ ...tempFilters });
    setPage(1);
    setData([]);
  }, [tempFilters]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    isFetchingRef.current = false; // Reset fetching state
    setTempFilters(initialFilterState);
    setAppliedFilters(initialFilterState);
    setPage(1);
    setData([]);
  }, [initialFilterState]);

  // Fetch when applied filters change
  useEffect(() => {
    handleFetch(1, false);
  }, [appliedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Store latest values in refs to avoid recreating observer
  const stateRef = useRef({ hasMore, loading, loadingMore, page });
  useEffect(() => {
    stateRef.current = { hasMore, loading, loadingMore, page };
  }, [hasMore, loading, loadingMore, page]);

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const state = stateRef.current;
        if (entry.isIntersecting && state.hasMore && !state.loading && !state.loadingMore && !isFetchingRef.current) {
          handleFetch(state.page + 1, true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(currentRef);

    return () => observer.disconnect();
  }, [handleFetch]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            {showSearch && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={tempFilters.search}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  className="pl-10 h-9"
                />
              </div>
            )}

            {/* Filter dropdowns */}
            {filters.map((filter) => (
              <Select
                key={filter.id}
                value={tempFilters[filter.id] || 'all'}
                onValueChange={(value) => setTempFilters(prev => ({ ...prev, [filter.id]: value }))}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

          </div>

          {/* Right side: Count, Actions, Reset and Apply */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Result count */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-medium tabular-nums">{data.length}</span>
              <span>/</span>
              <span className="tabular-nums">{totalCount}</span>
              <span className="text-xs">items</span>
            </div>

            {/* Divider */}
            {(showRefresh || actions || showSearch || filters.length > 0) && (
              <div className="h-6 w-px bg-border" />
            )}

            {/* Refresh button */}
            {showRefresh && (
              <Button variant="ghost" size="sm" onClick={() => handleFetch(1, false)} disabled={loading} className="h-9 px-2">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            )}

            {/* Actions */}
            {actions}

            {/* Reset Button */}
            {(showSearch || filters.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="h-9 gap-1"
              >
                <X className="h-4 w-4" />
                Reset
              </Button>
            )}

            {/* Apply Button */}
            {(showSearch || filters.length > 0) && (
              <Button
                onClick={handleApplyFilters}
                disabled={!filtersChanged}
                size="sm"
                className="h-9"
              >
                Apply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    col.headerClassName,
                    index === 0 && '!pl-6',
                    index === columns.length - 1 && '!pr-6'
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12">
                  {emptyIcon && <div className="mb-4 flex justify-center">{emptyIcon}</div>}
                  <p className="text-lg font-medium">{emptyTitle}</p>
                  <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors hover:bg-muted/50",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col, index) => (
                    <TableCell
                      key={col.id}
                      className={cn(
                        col.cellClassName,
                        index === 0 && '!pl-6',
                        index === columns.length - 1 && '!pr-6'
                      )}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-4 text-center">
          {loadingMore && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
          {!hasMore && data.length > 0 && (
            <p className="text-sm text-muted-foreground">All items loaded</p>
          )}
        </div>
      </div>
    </div>
  );
}
