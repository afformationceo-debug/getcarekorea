'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Plus,
  Search,
  Star,
  CheckCircle,
  XCircle,
  Filter,
  X,
  ChevronDown,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Constants
const PAGE_SIZE = 40;

type LocalizedField = Record<string, string>;
type LocalizedCertifications = Record<string, string[]>;

interface AuthorPersona {
  id: string;
  slug: string;
  name: LocalizedField;
  bio_short: LocalizedField;
  bio_full: LocalizedField;
  photo_url: string | null;
  years_of_experience: number;
  primary_specialty: string;
  secondary_specialties: string[];
  languages: Array<{ code: string; proficiency: string }>;
  certifications: string[] | LocalizedCertifications;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  total_posts: number;
  location: string;
  preferred_messenger: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface InterpretersTableProps {
  interpreters: AuthorPersona[];
}

interface FilterState {
  search: string;
  languages: string[];
  specialties: string[];
  status: string;
}

const LOCALE_CODES = ['en', 'ko', 'ja', 'zh-TW', 'zh-CN', 'th', 'mn', 'ru'] as const;
const SPECIALTY_VALUES = ['plastic-surgery', 'dermatology', 'dental', 'health-checkup', 'fertility', 'hair-transplant', 'ophthalmology', 'orthopedics', 'general-medical'] as const;

// Get first available name from localized field
function getDisplayName(name: LocalizedField | undefined): string {
  if (!name) return 'No name';
  return name.en || name.ko || Object.values(name).find(v => v) || 'No name';
}

export function InterpretersTable({ interpreters: initialInterpreters }: InterpretersTableProps) {
  const t = useTranslations('admin.interpreters');
  const params = useParams();
  const locale = params.locale as string;

  // Data state
  const [interpreters, setInterpreters] = useState<AuthorPersona[]>(initialInterpreters);
  const [totalCount, setTotalCount] = useState(initialInterpreters.length);
  const [hasMore, setHasMore] = useState(initialInterpreters.length >= PAGE_SIZE);
  const [page, setPage] = useState(1);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Temporary filter state (UI)
  const [tempFilters, setTempFilters] = useState<FilterState>({
    search: '',
    languages: [],
    specialties: [],
    status: 'all',
  });

  // Applied filter state (used for fetching/filtering)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    search: '',
    languages: [],
    specialties: [],
    status: 'all',
  });

  // Check if filters have changed
  const filtersChanged = useMemo(() => {
    return (
      tempFilters.search !== appliedFilters.search ||
      tempFilters.status !== appliedFilters.status ||
      tempFilters.languages.length !== appliedFilters.languages.length ||
      tempFilters.specialties.length !== appliedFilters.specialties.length ||
      !tempFilters.languages.every(l => appliedFilters.languages.includes(l)) ||
      !tempFilters.specialties.every(s => appliedFilters.specialties.includes(s))
    );
  }, [tempFilters, appliedFilters]);

  // Check if any filter is active
  const hasActiveFilters = appliedFilters.search || appliedFilters.languages.length > 0 || appliedFilters.specialties.length > 0 || appliedFilters.status !== 'all';

  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Toggle language filter
  const toggleLanguageFilter = (code: string) => {
    setTempFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(code)
        ? prev.languages.filter(c => c !== code)
        : [...prev.languages, code]
    }));
  };

  // Toggle specialty filter
  const toggleSpecialtyFilter = (spec: string) => {
    setTempFilters(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec]
    }));
  };

  // Filter interpreters client-side based on applied filters
  const filterInterpreters = useCallback((data: AuthorPersona[]): AuthorPersona[] => {
    return data.filter((interpreter) => {
      // Search filter (name, slug)
      if (appliedFilters.search) {
        const searchLower = appliedFilters.search.toLowerCase();
        const allNames = Object.values(interpreter.name || {}).join(' ').toLowerCase();
        const slug = interpreter.slug?.toLowerCase() || '';
        if (!allNames.includes(searchLower) && !slug.includes(searchLower)) {
          return false;
        }
      }

      // Language filter (multi-select: match ANY selected language)
      if (appliedFilters.languages.length > 0) {
        const hasAnyLanguage = interpreter.languages?.some(l => appliedFilters.languages.includes(l.code));
        if (!hasAnyLanguage) return false;
      }

      // Specialty filter (multi-select: match ANY selected specialty)
      if (appliedFilters.specialties.length > 0) {
        const hasAnySpecialty = appliedFilters.specialties.includes(interpreter.primary_specialty) ||
          interpreter.secondary_specialties?.some(s => appliedFilters.specialties.includes(s));
        if (!hasAnySpecialty) return false;
      }

      // Status filter
      if (appliedFilters.status !== 'all') {
        switch (appliedFilters.status) {
          case 'active':
            if (!interpreter.is_active) return false;
            break;
          case 'inactive':
            if (interpreter.is_active) return false;
            break;
          case 'featured':
            if (!interpreter.is_featured) return false;
            break;
          case 'verified':
            if (!interpreter.is_verified) return false;
            break;
        }
      }

      return true;
    });
  }, [appliedFilters]);

  // Fetch interpreters from API
  const fetchInterpreters = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', PAGE_SIZE.toString());
      params.set('locale', locale);

      const response = await fetch(`/api/admin/interpreters?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        const newData = data.data || [];

        if (append) {
          setInterpreters(prev => [...prev, ...newData]);
        } else {
          setInterpreters(newData);
        }

        setTotalCount(data.pagination?.total || newData.length);
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching interpreters:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [locale]);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...tempFilters });
  }, [tempFilters]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const cleared: FilterState = {
      search: '',
      languages: [],
      specialties: [],
      status: 'all',
    };
    setTempFilters(cleared);
    setAppliedFilters(cleared);
  }, []);

  // Filtered interpreters
  const filteredInterpreters = useMemo(() => {
    return filterInterpreters(interpreters);
  }, [interpreters, filterInterpreters]);

  // Paginated data for display
  const displayedInterpreters = useMemo(() => {
    return filteredInterpreters.slice(0, page * PAGE_SIZE);
  }, [filteredInterpreters, page]);

  // Check if there's more filtered data
  const hasMoreFiltered = displayedInterpreters.length < filteredInterpreters.length;

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreFiltered && !loading && !loadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreFiltered, loading, loadingMore]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-4">
          {/* First row: Search + Add button */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={tempFilters.search}
                onChange={(e) => setTempFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchInterpreters(1, false)} disabled={loading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                {t('filters.refresh') || 'Refresh'}
              </Button>
              <Button asChild>
                <Link href={`/${locale}/admin/interpreters/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addInterpreter')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Second row: Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{t('filters.label')}</span>
            </div>

            {/* Language Filter (Multi-select) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 justify-between min-w-[140px]",
                    tempFilters.languages.length > 0 && "border-primary"
                  )}
                >
                  {tempFilters.languages.length === 0 ? (
                    <span className="text-muted-foreground">{t('filters.language')}</span>
                  ) : (
                    <span>{t('filters.selected', { count: tempFilters.languages.length })}</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-1">
                  {LOCALE_CODES.map((code) => (
                    <label
                      key={code}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={tempFilters.languages.includes(code)}
                        onCheckedChange={() => toggleLanguageFilter(code)}
                      />
                      <span className="text-sm">{t(`locales.${code}`)}</span>
                    </label>
                  ))}
                </div>
                {tempFilters.languages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setTempFilters(prev => ({ ...prev, languages: [] }))}
                  >
                    {t('filters.clearSelection')}
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            {/* Specialty Filter (Multi-select) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 justify-between min-w-[150px]",
                    tempFilters.specialties.length > 0 && "border-primary"
                  )}
                >
                  {tempFilters.specialties.length === 0 ? (
                    <span className="text-muted-foreground">{t('filters.specialty')}</span>
                  ) : (
                    <span>{t('filters.selected', { count: tempFilters.specialties.length })}</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-1">
                  {SPECIALTY_VALUES.map((spec) => (
                    <label
                      key={spec}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={tempFilters.specialties.includes(spec)}
                        onCheckedChange={() => toggleSpecialtyFilter(spec)}
                      />
                      <span className="text-sm">{t(`specialties.${spec}`)}</span>
                    </label>
                  ))}
                </div>
                {tempFilters.specialties.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setTempFilters(prev => ({ ...prev, specialties: [] }))}
                  >
                    {t('filters.clearSelection')}
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select
              value={tempFilters.status}
              onValueChange={(value) => setTempFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder={t('filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatus')}</SelectItem>
                <SelectItem value="active">{t('filters.active')}</SelectItem>
                <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
                <SelectItem value="featured">{t('filters.featured')}</SelectItem>
                <SelectItem value="verified">{t('filters.verified')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Apply Button */}
            <Button
              onClick={handleApplyFilters}
              disabled={!filtersChanged}
              size="sm"
              className="h-9"
            >
              Apply
            </Button>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-3">
                <X className="h-4 w-4 mr-1" />
                {t('filters.reset')}
              </Button>
            )}

            {/* Result count */}
            <div className="ml-auto text-sm text-muted-foreground">
              {t('filters.resultCount', { count: filteredInterpreters.length, total: interpreters.length })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('stats.total')}</p>
          <p className="text-3xl font-bold">{interpreters.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('stats.active')}</p>
          <p className="text-3xl font-bold text-green-600">
            {interpreters.filter((i) => i.is_active).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('stats.featured')}</p>
          <p className="text-3xl font-bold text-purple-600">
            {interpreters.filter((i) => i.is_featured).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('stats.verified')}</p>
          <p className="text-3xl font-bold text-blue-600">
            {interpreters.filter((i) => i.is_verified).length}
          </p>
        </div>
      </div>

      {/* Table - Always render structure, show loading inside */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">{t('table.interpreter')}</TableHead>
              <TableHead>{t('table.languages')}</TableHead>
              <TableHead>{t('table.specialty')}</TableHead>
              <TableHead className="text-center">{t('table.status')}</TableHead>
              <TableHead className="text-center">{t('table.stats')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && interpreters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedInterpreters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {hasActiveFilters ? t('noFilterResults') : t('noResults')}
                </TableCell>
              </TableRow>
            ) : (
                  displayedInterpreters.map((interpreter) => (
                    <TableRow
                      key={interpreter.id}
                      className={cn(
                        "relative transition-colors hover:bg-muted/50",
                        !interpreter.is_active && "opacity-50"
                      )}
                    >
                      <TableCell>
                        {/* Full row link overlay */}
                        <Link
                          href={`/${locale}/admin/interpreters/${interpreter.id}`}
                          className="absolute inset-0 z-10"
                          aria-label={`${getDisplayName(interpreter.name)} ${t('viewDetails')}`}
                        />
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                            {interpreter.photo_url ? (
                              <Image
                                src={interpreter.photo_url}
                                alt={getDisplayName(interpreter.name)}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized={interpreter.photo_url?.includes('.svg') || interpreter.photo_url?.includes('dicebear')}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                                {getDisplayName(interpreter.name)[0] || '?'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{getDisplayName(interpreter.name)}</p>
                            <p className="text-xs text-muted-foreground">
                              /{interpreter.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {interpreter.languages?.[0] && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {t(`locales.${interpreter.languages[0].code}`)}
                            </Badge>
                          )}
                          {interpreter.languages?.length > 1 && (
                            <Badge variant="outline" className="text-xs font-normal">
                              +{interpreter.languages.length - 1}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {t(`specialties.${interpreter.primary_specialty}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {interpreter.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {interpreter.is_featured && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                          {interpreter.is_verified && (
                            <Badge variant="secondary" className="text-xs">{t('stats.verified')}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{interpreter.avg_rating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('table.reviews', { count: interpreter.review_count || 0 })}
                          </p>
                        </div>
                      </TableCell>
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
          {!hasMoreFiltered && displayedInterpreters.length > 0 && (
            <p className="text-sm text-muted-foreground">All interpreters loaded</p>
          )}
        </div>
      </div>
    </div>
  );
}
