'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Search,
  Plus,
  Play,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  Eye,
  Trash2,
  Edit2,
  FileText,
  RefreshCw,
  X,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { KeywordBulkUpload } from '@/components/admin/KeywordBulkUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

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
    title_en: string;
    status: string;
  } | null;
}


const CATEGORIES = [
  { value: 'plastic-surgery', label: 'Plastic Surgery' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'dental', label: 'Dental' },
  { value: 'health-checkup', label: 'Health Checkup' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'general', label: 'General' },
];

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  ja: '日本語',
  th: 'ภาษาไทย',
  mn: 'Монгол',
  ru: 'Русский',
};

export default function KeywordsPage() {
  const router = useRouter();
  const params = useParams();
  const currentLocale = params.locale as string || 'en';

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    generated: 0,
    published: 0,
  });

  // Content generation state - translateAll removed (single-language generation only)

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

  // Fetch keywords
  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/keywords?${params}`);
      const data = await response.json();

      console.log('[KEYWORDS PAGE] API Response:', data);
      console.log('[KEYWORDS PAGE] Keywords count:', data.data?.keywords?.length);
      console.log('[KEYWORDS PAGE] First keyword:', data.data?.keywords?.[0]);

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch keywords');
      }

      setKeywords(data.data.keywords);
      setCategories(data.data.categories);
      setTotalPages(Math.ceil(data.meta.total / data.meta.limit));

      // Calculate stats
      const allKeywords = data.data.keywords;
      setStats({
        total: data.meta.total,
        pending: allKeywords.filter((k: Keyword) => k.status === 'pending').length,
        generated: allKeywords.filter((k: Keyword) => k.status === 'generated').length,
        published: allKeywords.filter((k: Keyword) => k.status === 'published').length,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('[KEYWORDS PAGE] Fetch error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  // Single keyword generation state
  const [singleGenerating, setSingleGenerating] = useState<string | null>(null);
  const [generatedPostId, setGeneratedPostId] = useState<string | null>(null);
  const [showNavigateOption, setShowNavigateOption] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Poll for generation status
  const pollGenerationStatus = useCallback(async (keywordId: string) => {
    try {
      const response = await fetch(`/api/content/generate-status?keyword_id=${keywordId}`);
      const data = await response.json();

      if (data.success) {
        if (data.data.status === 'generated') {
          // Generation complete!
          if (data.data.blog_post?.id) {
            setGeneratedPostId(data.data.blog_post.id);
          }
          setSingleGenerating(null);
          setShowNavigateOption(false);
          fetchKeywords();
          return true; // Stop polling
        } else if (data.data.status === 'pending') {
          // Generation failed, reset
          setSingleGenerating(null);
          setShowNavigateOption(false);
          setError('콘텐츠 생성에 실패했습니다. 다시 시도해주세요.');
          fetchKeywords();
          return true; // Stop polling
        }
      }
      return false; // Continue polling
    } catch {
      return false; // Continue polling on error
    }
  }, [fetchKeywords]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Generate content - Updated for single-language API
  const handleGenerateContent = async (keyword: Keyword) => {
    setSingleGenerating(keyword.id);
    setGeneratedPostId(null);
    setShowNavigateOption(false);
    setError(null);

    // Update keyword status to 'generating' immediately (optimistic update)
    setKeywords(prev => prev.map(k =>
      k.id === keyword.id ? { ...k, status: 'generating' as const } : k
    ));

    try {
      // Use new single-language API
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

      if (!data.success) {
        throw new Error(data.message || data.error || 'Content generation failed');
      }

      // Handle successful completion
      if (data.saved && data.content?.id) {
        setGeneratedPostId(data.content.id);
        setSingleGenerating(null);
        fetchKeywords();
      } else {
        throw new Error('Content generated but not saved');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      setSingleGenerating(null);

      // Reset keyword status
      setKeywords(prev => prev.map(k =>
        k.id === keyword.id ? { ...k, status: 'pending' as const } : k
      ));

      fetchKeywords();
    }
  };

  // Navigate to content page - can be called during generation
  const handleGoToContent = () => {
    router.push(`/${currentLocale}/admin/content`);
  };

  // Navigate immediately while generation continues in background
  const handleNavigateWhileGenerating = () => {
    // Clear local state but keep request running via keepalive
    setShowNavigateOption(false);
    router.push(`/${currentLocale}/admin/content`);
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === keywords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(keywords.map(k => k.id)));
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

  // Bulk generate content (parallel execution) - Updated for single-language API
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

    // Process in parallel batches of 3 to avoid rate limiting
    const BATCH_SIZE = 3;
    const results: Array<{ keyword: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < selectedKeywords.length; i += BATCH_SIZE) {
      const batch = selectedKeywords.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (kw) => {
        try {
          // Use new single-language API
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
    fetchKeywords();
  };

  // Delete keyword
  const handleDeleteKeyword = async (id: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) return;

    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete keyword');
      }

      fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-gray-500" />,
    generating: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    generated: <CheckCircle className="h-4 w-4 text-yellow-500" />,
    published: <CheckCircle className="h-4 w-4 text-green-500" />,
  };

  const statusBadges = {
    pending: 'secondary',
    generating: 'default',
    generated: 'outline',
    published: 'default',
  } as const;

  const [showBulkUpload, setShowBulkUpload] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Keyword Management</h1>
          <p className="text-muted-foreground">
            Manage SEO keywords and AI content generation
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBulkGenerate}
              disabled={bulkGenerating}
              className="bg-green-600 hover:bg-green-700"
              aria-label={bulkGenerating ? `생성 진행 중: ${selectedIds.size}개 키워드` : `${selectedIds.size}개 키워드 생성`}
              aria-busy={bulkGenerating}
            >
              {bulkGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Generate {selectedIds.size} Selected
            </Button>
          )}
          <Button variant="outline" onClick={fetchKeywords}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpload(!showBulkUpload)}>
            <Upload className="mr-2 h-4 w-4" />
            {showBulkUpload ? '업로드 닫기' : 'CSV 일괄 등록'}
          </Button>
          <AddKeywordDialog categories={categories} onSuccess={fetchKeywords} />
        </div>
      </div>

      {/* Bulk Upload Section */}
      {showBulkUpload && (
        <Card>
          <CardContent className="pt-6">
            <KeywordBulkUpload
              onUploadComplete={(result) => {
                if (result.success || result.data.inserted > 0) {
                  fetchKeywords();
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {error && (
        <div
          className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
            aria-label="Close error message"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Generation in progress notification with navigate option */}
      {singleGenerating && showNavigateOption && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <div>
                  <h3 className="font-semibold text-blue-800">콘텐츠 생성 중...</h3>
                  <p className="text-sm text-blue-700">생성이 완료될 때까지 기다리거나, 다른 페이지로 이동할 수 있습니다.</p>
                  <p className="text-xs text-blue-600 mt-1">백그라운드에서 생성이 계속 진행됩니다.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNavigateOption(false)}
                >
                  여기서 대기
                </Button>
                <Button
                  size="sm"
                  onClick={handleNavigateWhileGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Content 페이지로 이동
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success notification after single generation */}
      {generatedPostId && !singleGenerating && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div
              className="flex items-center justify-between"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-green-800">콘텐츠가 생성되었습니다!</h3>
                  <p className="text-sm text-green-700">Content 페이지에서 미리보기하고 발행할 수 있습니다.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setGeneratedPostId(null); setShowNavigateOption(false); }}
                  aria-label="Close success message"
                >
                  닫기
                </Button>
                <Button
                  size="sm"
                  onClick={handleGoToContent}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  콘텐츠 확인하기
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
            <div
              className="space-y-4"
              role="status"
              aria-live="polite"
              aria-atomic="false"
              aria-busy={bulkGenerating}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {bulkGenerating ? '일괄 생성 진행 중...' : '일괄 생성 완료'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBulkProgress(null)}
                  disabled={bulkGenerating}
                  aria-label="Close progress notification"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <Progress
                value={(bulkProgress.completed / bulkProgress.total) * 100}
                aria-label={`진행률: ${Math.round((bulkProgress.completed / bulkProgress.total) * 100)}%`}
              />
              <div className="flex gap-4 text-sm" aria-label="Progress details">
                <span>진행: {bulkProgress.completed}/{bulkProgress.total}</span>
                <span className="text-green-600">성공: {bulkProgress.succeeded}</span>
                <span className="text-red-600">실패: {bulkProgress.failed}</span>
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
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/${currentLocale}/admin/content`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    생성된 콘텐츠 확인하기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.generated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
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
        {/* Translate All switch removed - single-language generation only */}
      </div>

      {/* Keywords Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : keywords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No keywords found</p>
            <p className="text-sm text-muted-foreground">
              Add your first keyword to start generating content
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedIds.size === keywords.length && keywords.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm">
                    Volume
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Competition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((keyword) => (
                <TableRow key={keyword.id} className={selectedIds.has(keyword.id) ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(keyword.id)}
                      onChange={() => handleSelectOne(keyword.id)}
                      disabled={keyword.status !== 'pending'}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{keyword.keyword}</p>
                      {keyword.blog_posts?.title_en && (
                        <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                          {keyword.blog_posts.title_en}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{keyword.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{keyword.locale.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {keyword.search_volume?.toLocaleString() || '-'}
                  </TableCell>
                  <TableCell className="text-right">
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {statusIcons[keyword.status]}
                      <Badge variant={statusBadges[keyword.status]}>
                        {keyword.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Generate Button */}
                      {(keyword.status === 'pending' || keyword.status === 'generated') && (
                        <Button
                          size="sm"
                          variant={keyword.status === 'pending' ? 'default' : 'outline'}
                          onClick={() => handleGenerateContent(keyword)}
                          disabled={singleGenerating === keyword.id}
                          className="gap-1"
                          aria-label={
                            singleGenerating === keyword.id
                              ? `${keyword.keyword} 콘텐츠 생성 중`
                              : `${keyword.keyword} 콘텐츠 ${keyword.status === 'pending' ? '생성' : '재생성'}`
                          }
                          aria-busy={singleGenerating === keyword.id}
                        >
                          {singleGenerating === keyword.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" aria-hidden="true" />
                              {keyword.status === 'pending' ? 'Generate' : 'Regenerate'}
                            </>
                          )}
                        </Button>
                      )}
                      {/* View Content Button for generated/published */}
                      {(keyword.status === 'generated' || keyword.status === 'published') && keyword.blog_post_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleGoToContent}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      )}
                      {/* More Options */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Keyword
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteKeyword(keyword.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

    </div>
  );
}

// Add Keyword Dialog
function AddKeywordDialog({
  categories,
  onSuccess,
}: {
  categories: string[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    keyword: '',
    category: '',
    locale: 'en',
    search_volume: '',
    competition: '',
    priority: '1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: formData.keyword,
          category: formData.category || 'general',
          locale: formData.locale,
          search_volume: formData.search_volume ? parseInt(formData.search_volume) : null,
          competition: formData.competition || null,
          priority: parseInt(formData.priority),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to add keyword');
      }

      setOpen(false);
      setFormData({
        keyword: '',
        category: '',
        locale: 'en',
        search_volume: '',
        competition: '',
        priority: '1',
      });
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add keyword');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Keyword
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Keyword</DialogTitle>
          <DialogDescription>
            Add a keyword to generate SEO-optimized content
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label>Keyword *</Label>
            <Input
              placeholder="e.g., best rhinoplasty korea"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target Locale</Label>
            <Select
              value={formData.locale}
              onValueChange={(value) => setFormData({ ...formData, locale: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select locale" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOCALE_NAMES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Search Volume</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.search_volume}
                onChange={(e) => setFormData({ ...formData, search_volume: e.target.value })}
              />
            </div>
            <div>
              <Label>Competition (0-1)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.5"
                value={formData.competition}
                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Priority (1-10)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Keyword
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Import Keywords Dialog - Now using KeywordBulkUpload component
function ImportKeywordsDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          CSV 일괄 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>키워드 일괄 등록</DialogTitle>
          <DialogDescription>
            CSV 파일로 키워드를 일괄 등록합니다. 포맷: 키워드(현지어)|키워드(한국어)|검색량
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <KeywordBulkUpload
            onUploadComplete={(result) => {
              if (result.success || result.data.inserted > 0) {
                onSuccess();
                // Close dialog after successful upload
                setTimeout(() => setOpen(false), 1500);
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

