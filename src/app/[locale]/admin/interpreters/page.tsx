'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { DataTable, ColumnDef, FilterDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsGrid } from '@/components/ui/stat-card';
import {
  Plus,
  Star,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';

// Types
type LocalizedField = Record<string, string>;

interface AuthorPersona {
  id: string;
  slug: string;
  name: LocalizedField;
  bio_short: LocalizedField;
  photo_url: string | null;
  years_of_experience: number;
  primary_specialty: string;
  secondary_specialties: string[];
  languages: Array<{ code: string; proficiency: string }>;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  avg_rating: number;
  review_count: number;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  featured: number;
  verified: number;
}

const PAGE_SIZE = 40;

// Get first available name
function getDisplayName(name: LocalizedField | undefined): string {
  if (!name) return 'No name';
  return name.en || name.ko || Object.values(name).find(v => v) || 'No name';
}

export default function InterpretersAdminPage() {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params.locale as string) || 'en';
  const t = useTranslations('admin.interpreters');

  // Stats state
  const [stats, setStats] = useState<Stats>({
    total: 0, active: 0, featured: 0, verified: 0,
  });

  // Fetch function for DataTable
  const fetchInterpreters = useCallback(async (page: number, filters: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', page.toString());
    searchParams.set('limit', PAGE_SIZE.toString());

    const response = await fetch(`/api/admin/interpreters?${searchParams.toString()}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch interpreters');
    }

    // Update stats from API response (global counts, not filtered)
    if (data.stats) {
      setStats(data.stats);
    }

    // Client-side filtering
    let filtered = data.data || [];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((i: AuthorPersona) => {
        const names = Object.values(i.name || {}).join(' ').toLowerCase();
        return names.includes(searchLower) || i.slug?.toLowerCase().includes(searchLower);
      });
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((i: AuthorPersona) => {
        switch (filters.status) {
          case 'active': return i.is_active;
          case 'inactive': return !i.is_active;
          case 'featured': return i.is_featured;
          case 'verified': return i.is_verified;
          default: return true;
        }
      });
    }

    if (filters.language && filters.language !== 'all') {
      filtered = filtered.filter((i: AuthorPersona) =>
        i.languages?.some((lang) => lang.code === filters.language)
      );
    }

    return {
      data: filtered,
      total: data.pagination?.total || filtered.length,
      hasMore: data.pagination?.hasMore || false,
    };
  }, []);

  // Filter definitions
  const filters: FilterDef[] = [
    {
      id: 'status',
      label: t('filters.status'),
      defaultValue: 'all',
      options: [
        { value: 'all', label: t('filters.allStatus') },
        { value: 'active', label: t('filters.active') },
        { value: 'inactive', label: t('filters.inactive') },
        { value: 'featured', label: t('filters.featured') },
        { value: 'verified', label: t('filters.verified') },
      ],
    },
    {
      id: 'language',
      label: t('filters.language'),
      defaultValue: 'all',
      options: [
        { value: 'all', label: t('filters.allLanguages') },
        { value: 'en', label: t('languages.en') },
        { value: 'ko', label: t('languages.ko') },
        { value: 'zh', label: t('languages.zh') },
        { value: 'ja', label: t('languages.ja') },
        { value: 'vi', label: t('languages.vi') },
        { value: 'th', label: t('languages.th') },
        { value: 'ru', label: t('languages.ru') },
      ],
    },
  ];

  // Column definitions
  const columns: ColumnDef<AuthorPersona>[] = [
    {
      id: 'interpreter',
      header: t('table.interpreter'),
      headerClassName: 'w-[280px]',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
            {row.photo_url ? (
              <Image
                src={row.photo_url}
                alt={getDisplayName(row.name)}
                fill
                sizes="40px"
                className="object-cover"
                unoptimized={row.photo_url?.includes('.svg') || row.photo_url?.includes('dicebear')}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {getDisplayName(row.name)[0] || '?'}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium">{getDisplayName(row.name)}</p>
            <p className="text-xs text-muted-foreground">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'languages',
      header: t('table.languages'),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.languages?.[0] && (
            <Badge variant="outline" className="text-xs font-normal">
              {row.languages[0].code.toUpperCase()}
            </Badge>
          )}
          {row.languages?.length > 1 && (
            <Badge variant="outline" className="text-xs font-normal">
              +{row.languages.length - 1}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'specialty',
      header: t('table.specialty'),
      cell: (row) => (
        <Badge variant="secondary" className="font-normal">
          {row.primary_specialty}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: t('table.status'),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          {row.is_active ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          {row.is_featured && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          )}
          {row.is_verified && (
            <Badge variant="secondary" className="text-xs">{t('stats.verified')}</Badge>
          )}
        </div>
      ),
    },
    {
      id: 'stats',
      header: t('table.stats'),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: (row) => (
        <div>
          <div className="flex items-center justify-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{row.avg_rating?.toFixed(1) || '0.0'}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {row.review_count || 0} reviews
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button asChild>
          <Link href={`/${currentLocale}/admin/interpreters/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t('addInterpreter')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsGrid
        columns={4}
        stats={[
          { label: t('stats.total'), value: stats.total },
          { label: t('stats.active'), value: stats.active, color: 'green' },
          { label: t('stats.featured'), value: stats.featured, color: 'yellow' },
          { label: t('stats.verified'), value: stats.verified, color: 'blue' },
        ]}
      />

      <DataTable<AuthorPersona>
        data={[]}
        totalCount={0}
        columns={columns}
        getRowId={(row) => row.id}
        fetchData={fetchInterpreters}
        filters={filters}
        searchPlaceholder={t('searchPlaceholder')}
        showRefresh={false}
        emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('noResults')}
        emptyDescription={t('noFilterResults')}
        onRowClick={(row) => router.push(`/${currentLocale}/admin/interpreters/${row.id}`)}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
