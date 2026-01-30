'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  X,
  Upload,
  ExternalLink,
  Filter,
  Loader2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { KeywordBulkUpload } from '@/components/admin/KeywordBulkUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Constants
const PAGE_SIZE = 40;

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

interface KeywordsTableProps {
  keywords: Keyword[];
  categories: string[];
  totalCount: number;
}

interface FilterState {
  search: string;
  status: string;
  category: string;
}

export function KeywordsTable({ keywords: initialKeywords, categories, totalCount: initialTotal }: KeywordsTableProps) {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params.locale as string) || 'en';

  // Data state
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialKeywords.length >= PAGE_SIZE);
  const [page, setPage] = useState(1);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state - temporary (not applied yet)
  const [tempFilters, setTempFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    category: 'all',
  });

  // Filter state - applied (used for fetching)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    category: 'all',
  });

  // Check if filters have changed
  const filtersChanged = useMemo(() => {
    return (
      tempFilters.search !== appliedFilters.search ||
      tempFilters.status !== appliedFilters.status ||
      tempFilters.category !== appliedFilters.category
    );
  }, [tempFilters, appliedFilters]);

  // UI state
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    total: number;
    completed: number;
    succeeded: number;
    failed: number;
    results: Array<{ keyword: string; success: boolean; error?: string }>;
  } | null>(null);

  // Single keyword generation state
  const [singleGenerating, setSingleGenerating] = useState<string | null>(null);
  const [generatedPostId, setGeneratedPostId] = useState<string | null>(null);

  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const generatingRef = useRef<Set<string>>(new Set());

  // Calculate stats from current keywords (but use totalCount for Total)
  const stats = useMemo(() => ({
    total: totalCount, // Use API total count
    pending: keywords.filter(k => k.status === 'pending').length,
    generating: keywords.filter(k => k.status === 'generating').length,
    generated: keywords.filter(k => k.status === 'generated').length,
    published: keywords.filter(k => k.status === 'published').length,
  }), [keywords, totalCount]);

  // Fetch keywords with filters
  const fetchKeywords = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set('page', pageNum.toString());
      searchParams.set('limit', PAGE_SIZE.toString());

      if (appliedFilters.search) {
        searchParams.set('search', appliedFilters.search);
      }
      if (appliedFilters.status !== 'all') {
        searchParams.set('status', appliedFilters.status);
      }
      if (appliedFilters.category !== 'all') {
        searchParams.set('category', appliedFilters.category);
      }

      const response = await fetch(`/api/keywords?${searchParams.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch keywords');
      }

      const newKeywords = data.data?.keywords || [];

      if (append) {
        setKeywords(prev => [...prev, ...newKeywords]);
      } else {
        setKeywords(newKeywords);
      }

      // Use pagination total from API
      setTotalCount(data.pagination?.total || 0);
      setHasMore(data.pagination?.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [appliedFilters]);

  // Apply filters - reset and fetch
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...tempFilters });
    setPage(1);
    setKeywords([]);
  }, [tempFilters]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    const cleared = { search: '', status: 'all', category: 'all' };
    setTempFilters(cleared);
    setAppliedFilters(cleared);
    setPage(1);
    setKeywords([]);
  }, []);

  // Fetch when applied filters change
  useEffect(() => {
    fetchKeywords(1, false);
  }, [appliedFilters, fetchKeywords]);

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchKeywords(page + 1, true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, page, fetchKeywords]);

  // Generate content
  const handleGenerateContent = async (keyword: Keyword) => {
    if (generatingRef.current.has(keyword.id)) {
      console.log(`Already generating: ${keyword.keyword}`);
      return;
    }

    generatingRef.current.add(keyword.id);
    setSingleGenerating(keyword.id);
    setGeneratedPostId(null);
    setError(null);

    setKeywords(prev => prev.map(k =>
      k.id === keyword.id ? { ...k, status: 'generating' as const } : k
    ));

    try {
      await fetch(`/api/keywords/${keyword.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'generating' }),
      });

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

      if (!data.success) {
        throw new Error(data.message || data.error || 'Content generation failed');
      }

      if (data.saved && data.content?.id) {
        setGeneratedPostId(data.content.id);
        fetchKeywords(1, false);
      } else {
        throw new Error('Content generated but not saved');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);

      try {
        await fetch(`/api/keywords/${keyword.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'pending' }),
        });
      } catch (resetErr) {
        console.error('Failed to reset keyword status:', resetErr);
      }

      setKeywords(prev => prev.map(k =>
        k.id === keyword.id ? { ...k, status: 'pending' as const } : k
      ));
    } finally {
      generatingRef.current.delete(keyword.id);
      setSingleGenerating(null);
    }
  };

  // Bulk selection handlers
  const pendingKeywords = useMemo(() => keywords.filter(k => k.status === 'pending'), [keywords]);

  const handleSelectAll = () => {
    if (selectedIds.size === pendingKeywords.length && pendingKeywords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingKeywords.map(k => k.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk generate
  const handleBulkGenerate = async () => {
    const selectedKeywords = keywords.filter(k => selectedIds.has(k.id) && k.status === 'pending');
    if (selectedKeywords.length === 0) {
      setError('No pending keywords selected for generation');
      return;
    }

    setBulkGenerating(true);
    setBulkProgress({
      total: selectedKeywords.length,
      completed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    });

    const BATCH_SIZE = 3;
    const results: Array<{ keyword: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < selectedKeywords.length; i += BATCH_SIZE) {
      const batch = selectedKeywords.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (kw) => {
        try {
          const response = await fetch('/api/content/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyword: kw.keyword,
              locale: kw.locale,
              category: kw.category || 'general',
              includeRAG: true,
              includeImages: true,
              imageCount: 3,
              autoSave: true,
            }),
          });

          const data = await response.json();
          return {
            keyword: kw.keyword,
            success: data.success !== false,
            error: data.message || data.error,
          };
        } catch (err) {
          return {
            keyword: kw.keyword,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      setBulkProgress(prev => prev ? {
        ...prev,
        completed: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: [...results],
      } : null);
    }

    setBulkGenerating(false);
    setSelectedIds(new Set());
    fetchKeywords(1, false);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-4">
          {/* First row: Search + Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search keywords..."
                value={tempFilters.search}
                onChange={(e) => setTempFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <Button
                  onClick={handleBulkGenerate}
                  disabled={bulkGenerating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {bulkGenerating ? (
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Generate {selectedIds.size} Selected
                </Button>
              )}
              <Button variant="outline" onClick={() => fetchKeywords(1, false)} disabled={loading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => setShowBulkUpload(!showBulkUpload)}>
                <Upload className="mr-2 h-4 w-4" />
                {showBulkUpload ? 'Close' : 'CSV Upload'}
              </Button>
              <Button asChild>
                <Link href={`/${currentLocale}/admin/keywords/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Keyword
                </Link>
              </Button>
            </div>
          </div>

          {/* Second row: Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>

            {/* Status Filter */}
            <Select
              value={tempFilters.status}
              onValueChange={(value) => setTempFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={tempFilters.category}
              onValueChange={(value) => setTempFilters(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
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
            {(appliedFilters.search || appliedFilters.status !== 'all' || appliedFilters.category !== 'all') && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-3">
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}

            {/* Result count */}
            <div className="ml-auto text-sm text-muted-foreground">
              {keywords.length} / {totalCount} keywords
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Upload Section */}
      {showBulkUpload && (
        <Card>
          <CardContent className="pt-6">
            <KeywordBulkUpload
              onUploadComplete={(result) => {
                if (result.success || result.data.inserted > 0) {
                  fetchKeywords(1, false);
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Success notification */}
      {generatedPostId && !singleGenerating && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Content generated!</h3>
                  <p className="text-sm text-green-700">You can preview and publish on the Content page.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setGeneratedPostId(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push(`/${currentLocale}/admin/content`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Content
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Generation Progress */}
      {bulkProgress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {bulkGenerating ? 'Bulk generation in progress...' : 'Bulk generation complete'}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setBulkProgress(null)} disabled={bulkGenerating}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={(bulkProgress.completed / bulkProgress.total) * 100} />
              <div className="flex gap-4 text-sm">
                <span>Progress: {bulkProgress.completed}/{bulkProgress.total}</span>
                <span className="text-green-600">Succeeded: {bulkProgress.succeeded}</span>
                <span className="text-red-600">Failed: {bulkProgress.failed}</span>
              </div>
              {bulkProgress.results.length > 0 && (
                <ScrollArea className="h-[150px] rounded border p-2">
                  {bulkProgress.results.map((r, i) => (
                    <div key={i} className={`text-sm py-1 ${r.success ? 'text-green-700' : 'text-red-700'}`}>
                      {r.success ? '✓' : '✗'} {r.keyword} {r.error && `- ${r.error}`}
                    </div>
                  ))}
                </ScrollArea>
              )}
              {!bulkGenerating && bulkProgress.succeeded > 0 && (
                <div className="flex justify-end pt-2 border-t">
                  <Button variant="default" size="sm" onClick={() => router.push(`/${currentLocale}/admin/content`)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Generated Content
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Keywords</p>
          <p className="text-3xl font-bold">{totalCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Generating</p>
          <p className="text-3xl font-bold text-blue-600">{stats.generating}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Generated</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.generated}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="text-3xl font-bold text-green-600">{stats.published}</p>
        </div>
      </div>

      {/* Keywords Table - Always render structure, show loading inside */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.size === pendingKeywords.length && pendingKeywords.length > 0}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Keyword</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Locale</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Competition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && keywords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : keywords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No keywords found</p>
                  <p className="text-sm text-muted-foreground">
                    {appliedFilters.search || appliedFilters.status !== 'all' || appliedFilters.category !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add your first keyword to start generating content'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              keywords.map((keyword) => (
                <TableRow
                  key={keyword.id}
                  onClick={() => router.push(`/${currentLocale}/admin/keywords/${keyword.id}`)}
                  className={cn(
                    "relative transition-colors hover:bg-muted/50 cursor-pointer",
                    selectedIds.has(keyword.id) && 'bg-blue-50'
                  )}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(keyword.id)}
                      onChange={() => handleSelectOne(keyword.id)}
                      disabled={keyword.status !== 'pending'}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <span className="font-medium">{keyword.keyword}</span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge variant="outline">{keyword.category}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge variant="secondary">{keyword.locale.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Badge variant={keyword.priority >= 7 ? "default" : keyword.priority >= 4 ? "secondary" : "outline"}>
                      {keyword.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {keyword.search_volume?.toLocaleString() || '-'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {keyword.competition ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${parseFloat(keyword.competition) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">
                          {(parseFloat(keyword.competition) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={keyword.status} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {keyword.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateContent(keyword);
                          }}
                          disabled={singleGenerating === keyword.id}
                          className="gap-1 min-w-[100px]"
                        >
                          {singleGenerating === keyword.id ? (
                            <LoadingSpinner size="xs" color="white" />
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              Generate
                            </>
                          )}
                        </Button>
                      )}
                      {keyword.status === 'generated' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateContent(keyword);
                          }}
                          disabled={singleGenerating === keyword.id}
                          className="gap-1 min-w-[100px]"
                        >
                          {singleGenerating === keyword.id ? (
                            <LoadingSpinner size="xs" color="muted" />
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              Regenerate
                            </>
                          )}
                        </Button>
                      )}
                      {keyword.status === 'published' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (keyword.blog_posts?.slug) {
                              window.open(`/${currentLocale}/blog/${keyword.blog_posts.slug}`, '_blank');
                            } else {
                              alert('Blog post information not found.');
                            }
                          }}
                          className="gap-1 min-w-[100px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Post
                        </Button>
                      )}
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
          {!hasMore && keywords.length > 0 && (
            <p className="text-sm text-muted-foreground">All keywords loaded</p>
          )}
        </div>
      </div>
    </div>
  );
}
