'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  Send,
  RefreshCw,
  Archive,
  ExternalLink,
  Key,
  MessageSquare,
  Upload,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';
import { DataTable, ColumnDef, FilterDef } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DeleteDialog } from '@/components/ui/confirm-dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// Types
interface BlogPost {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  seo_meta: Record<string, unknown> | null;
  category: string | null;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  cover_image_url: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  generation_metadata: Record<string, unknown> | null;
}

interface Stats {
  total: number;
  draft: number;
  review: number;
  published: number;
  archived: number;
  totalViews: number;
}

const PAGE_SIZE = 40;

export default function ContentPage() {
  const params = useParams();
  const currentLocale = params.locale as string || 'en';
  const t = useTranslations('admin.content');
  const tKeywords = useTranslations('admin.keywords');

  // Stats state
  const [stats, setStats] = useState<Stats>({
    total: 0, draft: 0, review: 0, published: 0, archived: 0, totalViews: 0,
  });

  // For tabs that show filtered data
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);

  // Modal states
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [deletePost, setDeletePost] = useState<BlogPost | null>(null);
  const [feedbackPost, setFeedbackPost] = useState<BlogPost | null>(null);

  // Action states
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Refresh trigger for DataTable
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch function for DataTable
  const fetchPosts = useCallback(async (page: number, filters: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', page.toString());
    searchParams.set('limit', PAGE_SIZE.toString());

    if (filters.search) searchParams.set('search', filters.search);
    if (filters.status && filters.status !== 'all') searchParams.set('status', filters.status);
    if (filters.category && filters.category !== 'all') searchParams.set('category', filters.category);
    if (filters.locale && filters.locale !== 'all') searchParams.set('locale', filters.locale);

    const response = await fetch(`/api/content?${searchParams.toString()}`);
    const data = await response.json();

    if (data.success) {
      setStats(data.data.stats);
      setAllPosts(data.data.posts);
      return {
        data: data.data.posts,
        total: data.data.pagination?.total || data.data.posts.length,
        hasMore: (data.data.pagination?.page || 1) < (data.data.pagination?.totalPages || 1),
      };
    }

    return { data: [], total: 0, hasMore: false };
  }, []);

  // Refresh data
  const refreshData = () => setRefreshKey(k => k + 1);

  // Helpers
  const getPostTitle = (post: BlogPost): string => post.title || 'Untitled';
  const getPostContent = (post: BlogPost): string => post.content || '';
  const getPostExcerpt = (post: BlogPost): string => post.excerpt || '';
  const getAvailableLocales = (post: BlogPost): string[] => post.locale ? [post.locale] : ['en'];

  const getKeywordInfo = (post: BlogPost): { keyword: string; locale: string } | null => {
    const metadata = post.generation_metadata as { keyword?: string; locale?: string } | null;
    return metadata?.keyword ? { keyword: metadata.keyword, locale: metadata.locale || 'en' } : null;
  };

  const getPublishedUrl = (post: BlogPost): string | null => {
    if (post.status === 'published' && post.slug) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      // Use post's locale, not admin page locale
      return `${baseUrl}/${post.locale || 'en'}/blog/${post.slug}`;
    }
    return null;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(currentLocale, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // Actions
  const handleStatusChange = async (postId: string, newStatus: string) => {
    setActionLoading(postId);
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, status: newStatus }),
      });
      const data = await response.json();
      if (data.success) refreshData();
      else alert('Failed to update status: ' + data.error?.message);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deletePost) return;
    setActionLoading(deletePost.id);
    try {
      const response = await fetch(`/api/content?id=${deletePost.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setDeletePost(null);
        refreshData();
      } else {
        alert('Failed to delete: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editPost) return;
    setActionLoading(editPost.id);
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPost),
      });
      const data = await response.json();
      if (data.success) {
        setEditPost(null);
        refreshData();
      } else {
        alert('Failed to save: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (postId: string) => {
    setPublishLoading(postId);
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, status: 'published', published_at: new Date().toISOString() }),
      });
      const data = await response.json();
      if (data.success) {
        alert(t('messages.publishSuccess'));
        refreshData();
      } else {
        alert(t('messages.publishFailed') + ': ' + (data.error?.message || ''));
      }
    } catch (error) {
      console.error('Publish error:', error);
    } finally {
      setPublishLoading(null);
    }
  };

  const handleFeedbackSubmit = async (regenerate: boolean) => {
    if (!feedbackPost) return;
    if (regenerate && !feedbackText.trim()) {
      alert(t('feedback.feedbackPlaceholder'));
      return;
    }

    setFeedbackLoading(true);
    try {
      if (regenerate) {
        const response = await fetch('/api/content/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentDraftId: feedbackPost.id,
            feedbackText: feedbackText,
            feedbackType: 'edit',
            regenerate: true,
          }),
        });
        const data = await response.json();
        if (data.success) {
          alert(t('messages.feedbackSuccess'));
          setFeedbackPost(null);
          setFeedbackText('');
          refreshData();
        } else {
          alert(t('messages.feedbackFailed') + ': ' + (data.error || data.message));
        }
      } else {
        await handlePublish(feedbackPost.id);
        setFeedbackPost(null);
        setFeedbackText('');
      }
    } catch (error) {
      console.error('Feedback error:', error);
    } finally {
      setFeedbackLoading(false);
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
        { value: 'draft', label: t('status.draft') },
        { value: 'review', label: t('status.review') },
        { value: 'published', label: t('status.published') },
        { value: 'archived', label: t('status.archived') },
      ],
    },
    {
      id: 'category',
      label: t('filters.category'),
      defaultValue: 'all',
      options: [
        { value: 'all', label: t('filters.allCategories') },
        { value: 'plastic-surgery', label: tKeywords('categories.plastic-surgery') },
        { value: 'dermatology', label: tKeywords('categories.dermatology') },
        { value: 'dental', label: tKeywords('categories.dental') },
        { value: 'health-checkup', label: tKeywords('categories.health-checkup') },
        { value: 'medical-tourism', label: tKeywords('categories.medical-tourism') },
      ],
    },
    {
      id: 'locale',
      label: t('filters.language'),
      defaultValue: 'all',
      options: [
        { value: 'all', label: t('filters.allLanguages') },
        { value: 'en', label: t('languages.en') },
        { value: 'ko', label: t('languages.ko') },
        { value: 'ja', label: t('languages.ja') },
        { value: 'zh-CN', label: t('languages.zh-CN') },
        { value: 'zh-TW', label: t('languages.zh-TW') },
        { value: 'th', label: t('languages.th') },
        { value: 'mn', label: t('languages.mn') },
        { value: 'ru', label: t('languages.ru') },
      ],
    },
  ];

  // Column definitions
  const columns: ColumnDef<BlogPost>[] = [
    {
      id: 'article',
      header: t('table.article'),
      cell: (row) => (
        <div className="flex items-start gap-3">
          <div className="rounded bg-muted p-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[250px]">{getPostTitle(row)}</p>
            <p className="text-sm text-muted-foreground truncate max-w-[250px]">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'keyword',
      header: t('table.keyword'),
      cell: (row) => {
        const info = getKeywordInfo(row);
        return info ? (
          <div className="flex items-center gap-1">
            <Key className="h-3 w-3 text-violet-500" />
            <span className="text-sm font-medium text-violet-700 max-w-[100px] truncate">{info.keyword}</span>
            <Badge variant="outline" className="text-xs ml-1">{info.locale.toUpperCase()}</Badge>
          </div>
        ) : <span className="text-sm text-muted-foreground">-</span>;
      },
    },
    {
      id: 'category',
      header: t('table.category'),
      cell: (row) => <Badge variant="outline">{row.category ? tKeywords(`categories.${row.category}`) : t('filters.uncategorized')}</Badge>,
    },
    {
      id: 'locale',
      header: t('table.language'),
      cell: (row) => <Badge variant="secondary" className="text-xs">{row.locale ? t(`languages.${row.locale}`) : t('languages.en')}</Badge>,
    },
    {
      id: 'status',
      header: t('table.status'),
      cell: (row) => <StatusBadge status={row.status} label={t(`status.${row.status}`)} />,
    },
    {
      id: 'url',
      header: t('table.publishedUrl'),
      cell: (row) => {
        const url = getPublishedUrl(row);
        return url ? (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-violet-600 hover:text-violet-800 text-sm truncate max-w-[120px] flex items-center gap-1">
            <LinkIcon className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{row.slug}</span>
          </a>
        ) : <span className="text-sm text-muted-foreground">-</span>;
      },
    },
    {
      id: 'preview',
      header: t('table.preview'),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: (row) => (
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.open(`/${currentLocale}/admin/content/preview/${encodeURIComponent(row.slug)}`, '_blank'); }} className="gap-1">
          <Eye className="h-3 w-3" />
          {t('actions.preview')}
        </Button>
      ),
    },
    {
      id: 'feedback',
      header: t('table.feedback'),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: (row) => row.status !== 'published' ? (
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFeedbackPost(row); }} className="gap-1">
          <MessageSquare className="h-3 w-3" />
          {t('table.feedback')}
        </Button>
      ) : <span className="text-sm text-muted-foreground">{t('feedback.published')}</span>,
    },
    {
      id: 'actions',
      header: t('table.actions'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={actionLoading === row.id}>
                {actionLoading === row.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/${currentLocale}/admin/content/preview/${encodeURIComponent(row.slug)}`, '_blank')}>
                <Eye className="mr-2 h-4 w-4" />{t('actions.preview')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditPost(row)}>
                <Edit className="mr-2 h-4 w-4" />{t('actions.edit')}
              </DropdownMenuItem>
              {row.status === 'published' && (
                <DropdownMenuItem onClick={() => window.open(`/${row.locale || 'en'}/blog/${row.slug}`, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />{t('actions.viewLive')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {row.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'review')}>
                  <Send className="mr-2 h-4 w-4" />{t('actions.submitForReview')}
                </DropdownMenuItem>
              )}
              {row.status === 'review' && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'published')} className="text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />{t('actions.approvePublish')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'draft')}>
                    <Clock className="mr-2 h-4 w-4" />{t('actions.returnToDraft')}
                  </DropdownMenuItem>
                </>
              )}
              {row.status === 'published' && (
                <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'archived')}>
                  <Archive className="mr-2 h-4 w-4" />{t('actions.archive')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => setDeletePost(row)}>
                <Trash2 className="mr-2 h-4 w-4" />{t('actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => window.location.href = `/${currentLocale}/admin/keywords`}>
          <Plus className="mr-2 h-4 w-4" />
          {t('generateFromKeywords')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.total')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.drafts')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-gray-500">{stats.draft}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.review')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-500">{stats.review}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.published')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{stats.published}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.views')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(stats.totalViews ?? 0).toLocaleString()}</div></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all')} ({stats.total})</TabsTrigger>
          <TabsTrigger value="review" className="text-yellow-600">{t('tabs.needsReview')} ({stats.review})</TabsTrigger>
          <TabsTrigger value="drafts">{t('tabs.drafts')} ({stats.draft})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable<BlogPost>
            key={refreshKey}
            data={[]}
            totalCount={0}
            columns={columns}
            getRowId={(row) => row.id}
            fetchData={fetchPosts}
            filters={filters}
            searchPlaceholder={t('searchPlaceholder')}
            showRefresh={false}
            emptyIcon={<FileText className="h-12 w-12 text-muted-foreground" />}
            emptyTitle={t('noResults')}
            emptyDescription={t('noResultsDescription')}
            pageSize={PAGE_SIZE}
          />
        </TabsContent>

        <TabsContent value="review">
          <Card className="p-6">
            {allPosts.filter(p => p.status === 'review').length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('messages.noPendingReview')}</p>
            ) : (
              <div className="space-y-4">
                {allPosts.filter(p => p.status === 'review').map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{getPostTitle(post)}</p>
                      <p className="text-sm text-muted-foreground">Created {new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(`/${currentLocale}/admin/content/preview/${encodeURIComponent(post.slug)}`, '_blank')}>
                        <Eye className="mr-2 h-4 w-4" />{t('actions.preview')}
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleStatusChange(post.id, 'published')} disabled={actionLoading === post.id}>
                        {actionLoading === post.id ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {t('actions.approvePublish')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          <Card className="p-6">
            {allPosts.filter(p => p.status === 'draft').length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('messages.noDrafts')}</p>
            ) : (
              <div className="space-y-4">
                {allPosts.filter(p => p.status === 'draft').map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{getPostTitle(post)}</p>
                      <p className="text-sm text-muted-foreground">Created {new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditPost(post)}>
                        <Edit className="mr-2 h-4 w-4" />{t('actions.edit')}
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleStatusChange(post.id, 'review')} disabled={actionLoading === post.id}>
                        {actionLoading === post.id ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {t('actions.submitForReview')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" />{t('edit.title')}</DialogTitle>
            <DialogDescription>{t('edit.description')}</DialogDescription>
          </DialogHeader>
          {editPost && (
            <div className="space-y-4">
              <div><label className="text-sm font-medium">{t('edit.slug')}</label><Input value={editPost.slug} onChange={(e) => setEditPost({ ...editPost, slug: e.target.value })} /></div>
              <div><label className="text-sm font-medium">{t('edit.articleTitle')}</label><Input value={editPost.title || ''} onChange={(e) => setEditPost({ ...editPost, title: e.target.value })} /></div>
              <div><label className="text-sm font-medium">{t('edit.excerpt')}</label><Textarea value={editPost.excerpt || ''} onChange={(e) => setEditPost({ ...editPost, excerpt: e.target.value })} rows={2} /></div>
              <div><label className="text-sm font-medium">{t('edit.content')}</label><Textarea value={editPost.content || ''} onChange={(e) => setEditPost({ ...editPost, content: e.target.value })} rows={15} className="font-mono text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('table.category')}</label>
                  <Select value={editPost.category || 'medical-tourism'} onValueChange={(value) => setEditPost({ ...editPost, category: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plastic-surgery">{tKeywords('categories.plastic-surgery')}</SelectItem>
                      <SelectItem value="dermatology">{tKeywords('categories.dermatology')}</SelectItem>
                      <SelectItem value="dental">{tKeywords('categories.dental')}</SelectItem>
                      <SelectItem value="health-checkup">{tKeywords('categories.health-checkup')}</SelectItem>
                      <SelectItem value="medical-tourism">{tKeywords('categories.medical-tourism')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('table.status')}</label>
                  <Select value={editPost.status} onValueChange={(value) => setEditPost({ ...editPost, status: value as BlogPost['status'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('status.draft')}</SelectItem>
                      <SelectItem value="review">{t('status.review')}</SelectItem>
                      <SelectItem value="published">{t('status.published')}</SelectItem>
                      <SelectItem value="archived">{t('status.archived')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditPost(null)}>{t('edit.cancel')}</Button>
                <Button onClick={handleSaveEdit} disabled={actionLoading === editPost.id}>
                  {actionLoading === editPost.id ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}{t('edit.saveChanges')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <DeleteDialog
        open={!!deletePost}
        onOpenChange={() => setDeletePost(null)}
        title={t('delete.title')}
        description={t('delete.description')}
        itemName={deletePost ? getPostTitle(deletePost) : ''}
        itemDescription={deletePost ? `/${deletePost.slug}` : ''}
        onConfirm={handleDelete}
        isLoading={actionLoading === deletePost?.id}
      />

      {/* Feedback Modal */}
      <Dialog open={!!feedbackPost} onOpenChange={() => { setFeedbackPost(null); setFeedbackText(''); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-violet-600" />{t('feedback.title')}</DialogTitle>
            <DialogDescription>{t('feedback.description')}</DialogDescription>
          </DialogHeader>
          {feedbackPost && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-lg">{getPostTitle(feedbackPost)}</p>
                    <p className="text-sm text-muted-foreground">/{feedbackPost.slug}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open(`/${currentLocale}/admin/content/preview/${encodeURIComponent(feedbackPost.slug)}`, '_blank')}>
                    <Eye className="mr-2 h-4 w-4" />{t('feedback.fullPreview')}
                  </Button>
                </div>
                {getPostExcerpt(feedbackPost) && <p className="text-sm text-muted-foreground line-clamp-2">{getPostExcerpt(feedbackPost)}</p>}
                {getKeywordInfo(feedbackPost) && (
                  <div className="flex items-center gap-2 mt-2">
                    <Key className="h-3 w-3 text-violet-500" />
                    <span className="text-sm text-violet-700">{t('feedback.keywordLabel')}: {getKeywordInfo(feedbackPost)?.keyword}</span>
                    <Badge variant="outline" className="text-xs">{getKeywordInfo(feedbackPost)?.locale.toUpperCase()}</Badge>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('feedback.feedbackContent')}</label>
                <Textarea placeholder={t('feedback.feedbackPlaceholder')} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={5} className="resize-none" />
                <p className="text-xs text-muted-foreground mt-1">{t('feedback.feedbackHint')}</p>
              </div>
              <Separator />
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => { setFeedbackPost(null); setFeedbackText(''); }} disabled={feedbackLoading}>{t('feedback.cancel')}</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleFeedbackSubmit(true)} disabled={feedbackLoading || !feedbackText.trim()} className="gap-2">
                    {feedbackLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}{t('feedback.regenerate')}
                  </Button>
                  <Button onClick={() => handleFeedbackSubmit(false)} disabled={feedbackLoading || publishLoading === feedbackPost.id} className="gap-2 bg-green-600 hover:bg-green-700">
                    {publishLoading === feedbackPost.id ? <LoadingSpinner size="sm" color="white" /> : <Upload className="h-4 w-4" />}{t('feedback.publishNow')}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
