'use client';

import { useState, useMemo } from 'react';
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
import {
  Plus,
  Search,
  Star,
  CheckCircle,
  XCircle,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const [interpreters] = useState(initialInterpreters);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilters, setLanguageFilters] = useState<string[]>([]);
  const [specialtyFilters, setSpecialtyFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  // Check if any filter is active
  const hasActiveFilters = searchQuery || languageFilters.length > 0 || specialtyFilters.length > 0 || statusFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setLanguageFilters([]);
    setSpecialtyFilters([]);
    setStatusFilter('all');
  };

  // Toggle language filter
  const toggleLanguageFilter = (code: string) => {
    setLanguageFilters(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Toggle specialty filter
  const toggleSpecialtyFilter = (spec: string) => {
    setSpecialtyFilters(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  // Filter interpreters
  const filteredInterpreters = useMemo(() => {
    return interpreters.filter((interpreter) => {
      // Search filter (name, slug)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const allNames = Object.values(interpreter.name || {}).join(' ').toLowerCase();
        const slug = interpreter.slug?.toLowerCase() || '';
        if (!allNames.includes(searchLower) && !slug.includes(searchLower)) {
          return false;
        }
      }

      // Language filter (multi-select: match ANY selected language)
      if (languageFilters.length > 0) {
        const hasAnyLanguage = interpreter.languages?.some(l => languageFilters.includes(l.code));
        if (!hasAnyLanguage) return false;
      }

      // Specialty filter (multi-select: match ANY selected specialty)
      if (specialtyFilters.length > 0) {
        const hasAnySpecialty = specialtyFilters.includes(interpreter.primary_specialty) ||
          interpreter.secondary_specialties?.some(s => specialtyFilters.includes(s));
        if (!hasAnySpecialty) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        switch (statusFilter) {
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
  }, [interpreters, searchQuery, languageFilters, specialtyFilters, statusFilter]);

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button asChild>
              <Link href={`/${locale}/admin/interpreters/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addInterpreter')}
              </Link>
            </Button>
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
                    languageFilters.length > 0 && "border-primary"
                  )}
                >
                  {languageFilters.length === 0 ? (
                    <span className="text-muted-foreground">{t('filters.language')}</span>
                  ) : (
                    <span>{t('filters.selected', { count: languageFilters.length })}</span>
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
                        checked={languageFilters.includes(code)}
                        onCheckedChange={() => toggleLanguageFilter(code)}
                      />
                      <span className="text-sm">{t(`locales.${code}`)}</span>
                    </label>
                  ))}
                </div>
                {languageFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setLanguageFilters([])}
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
                    specialtyFilters.length > 0 && "border-primary"
                  )}
                >
                  {specialtyFilters.length === 0 ? (
                    <span className="text-muted-foreground">{t('filters.specialty')}</span>
                  ) : (
                    <span>{t('filters.selected', { count: specialtyFilters.length })}</span>
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
                        checked={specialtyFilters.includes(spec)}
                        onCheckedChange={() => toggleSpecialtyFilter(spec)}
                      />
                      <span className="text-sm">{t(`specialties.${spec}`)}</span>
                    </label>
                  ))}
                </div>
                {specialtyFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setSpecialtyFilters([])}
                  >
                    {t('filters.clearSelection')}
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-3">
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

      {/* Table */}
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
            {filteredInterpreters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {hasActiveFilters ? t('noFilterResults') : t('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              filteredInterpreters.map((interpreter) => (
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
      </div>
    </div>
  );
}
