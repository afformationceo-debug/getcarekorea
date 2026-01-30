'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { DataTable, ColumnDef, FilterDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsGrid } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Plus,
  Play,
  RefreshCw,
  Upload,
  ExternalLink,
  FileText,
} from 'lucide-react';

// Types
interface Keyword {
  id: string;
  keyword: string;
  category: string;
  locale: string;
  search_volume: number | null;
  competition: string | null;
  priority: number;
  status: 'pending' | 'generating' | 'generated' | 'published';
  blog_post_id: string | null;
  created_at: string;
  blog_posts?: {
    id: string;
    slug: string;
    title: string;
    status: string;
  } | null;
}

interface Stats {
  total: number;
  pending: number;
  generating: number;
  generated: number;
  published: number;
}

const PAGE_SIZE = 40;

export default function KeywordsAdminPage() {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params.locale as string) || 'en';
  const t = useTranslations('admin.keywords');
  const tContent = useTranslations('admin.content');

  // Stats state
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, generating: 0, generated: 0, published: 0,
  });

  // Generation state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch function for DataTable
  const fetchKeywords = useCallback(async (page: number, filters: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', page.toString());
    searchParams.set('limit', PAGE_SIZE.toString());

    if (filters.search) searchParams.set('search', filters.search);
    if (filters.status && filters.status !== 'all') searchParams.set('status', filters.status);
    if (filters.category && filters.category !== 'all') searchParams.set('category', filters.category);

    const response = await fetch(`/api/keywords?${searchParams.toString()}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch keywords');
    }

    // Update stats from API response (global counts, not filtered)
    if (data.data?.stats) {
      setStats(data.data.stats);
    }

    return {
      data: data.data?.keywords || [],
      total: data.meta?.total || 0,
      hasMore: data.meta?.hasMore || false,
    };
  }, []);

  // Generate content handler
  const handleGenerate = async (keyword: Keyword) => {
    if (generatingId) return;

    setGeneratingId(keyword.id);
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.keyword,
          locale: keyword.locale,
          category: keyword.category || 'general',
          includeRAG: true,
          includeImages: true,
          imageCount: 3,
          autoSave: true,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setRefreshKey(k => k + 1);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGeneratingId(null);
    }
  };

  // Filter definitions
  const filters: FilterDef[] = [
    {
      id: 'status',
      label: t('filters.status'),
      defaultValue: 'all',
      options: [
        { value: 'all', label: t('filters.allStatus') },
        { value: 'pending', label: t('stats.pending') },
        { value: 'generating', label: t('stats.generating') },
        { value: 'generated', label: t('stats.generated') },
        { value: 'published', label: t('stats.published') },
      ],
    },
    {
      id: 'category',
      label: t('filters.category'),
      defaultValue: 'all',
      options: [
        { value: 'all', label: t('filters.allCategories') },
        { value: 'plastic-surgery', label: t('categories.plastic-surgery') },
        { value: 'dermatology', label: t('categories.dermatology') },
        { value: 'dental', label: t('categories.dental') },
        { value: 'health-checkup', label: t('categories.health-checkup') },
        { value: 'medical-tourism', label: t('categories.medical-tourism') },
      ],
    },
  ];

  // Column definitions
  const columns: ColumnDef<Keyword>[] = [
    {
      id: 'keyword',
      header: t('table.keyword'),
      cell: (row) => <span className="font-medium">{row.keyword}</span>,
    },
    {
      id: 'category',
      header: t('table.category'),
      cell: (row) => <Badge variant="outline">{t(`categories.${row.category}`)}</Badge>,
    },
    {
      id: 'locale',
      header: t('table.locale'),
      cell: (row) => <Badge variant="secondary">{tContent(`languages.${row.locale}`)}</Badge>,
    },
    {
      id: 'priority',
      header: t('table.priority'),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: (row) => (
        <Badge variant={row.priority >= 7 ? "default" : row.priority >= 4 ? "secondary" : "outline"}>
          {row.priority}
        </Badge>
      ),
    },
    {
      id: 'volume',
      header: t('table.volume'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (row) => row.search_volume?.toLocaleString() || '-',
    },
    {
      id: 'status',
      header: t('table.status'),
      cell: (row) => <StatusBadge status={row.status} label={t(`stats.${row.status}`)} />,
    },
    {
      id: 'actions',
      header: t('table.actions'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status === 'pending' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleGenerate(row)}
              disabled={generatingId === row.id}
              className="gap-1 min-w-[100px]"
            >
              {generatingId === row.id ? (
                <LoadingSpinner size="xs" color="white" />
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  {t('actions.generate')}
                </>
              )}
            </Button>
          )}
          {row.status === 'generated' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerate(row)}
              disabled={generatingId === row.id}
              className="gap-1 min-w-[100px]"
            >
              {generatingId === row.id ? (
                <LoadingSpinner size="xs" color="muted" />
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  {t('actions.regenerate')}
                </>
              )}
            </Button>
          )}
          {row.status === 'published' && row.blog_posts?.slug && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/${currentLocale}/blog/${row.blog_posts?.slug}`, '_blank')}
              className="gap-1 min-w-[100px]"
            >
              <ExternalLink className="h-3 w-3" />
              {t('actions.viewPost')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${currentLocale}/admin/keywords/bulk`}>
              <Upload className="mr-2 h-4 w-4" />
              {t('csvUpload')}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${currentLocale}/admin/keywords/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addKeyword')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsGrid
        columns={5}
        stats={[
          { label: t('stats.total'), value: stats.total },
          { label: t('stats.pending'), value: stats.pending, color: 'gray' },
          { label: t('stats.generating'), value: stats.generating, color: 'yellow' },
          { label: t('stats.generated'), value: stats.generated, color: 'blue' },
          { label: t('stats.published'), value: stats.published, color: 'green' },
        ]}
      />

      <DataTable<Keyword>
        key={refreshKey}
        data={[]}
        totalCount={0}
        columns={columns}
        getRowId={(row) => row.id}
        fetchData={fetchKeywords}
        filters={filters}
        searchPlaceholder={t('searchPlaceholder')}
        showRefresh={false}
        emptyIcon={<FileText className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('noResults')}
        emptyDescription={t('noResultsDescription')}
        onRowClick={(row) => router.push(`/${currentLocale}/admin/keywords/${row.id}`)}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
