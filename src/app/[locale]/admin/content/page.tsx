'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  RefreshCw,
  X,
  Archive,
  ExternalLink,
  Tag,
  Calendar,
  User,
  Heart,
  Bookmark,
  Share2,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Key,
  MessageSquare,
  Upload,
  Link as LinkIcon,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface BlogPost {
  id: string;
  slug: string;
  title_en: string | null;
  title_ko: string | null;
  title_zh_tw: string | null;
  title_zh_cn: string | null;
  title_ja: string | null;
  title_th: string | null;
  title_mn: string | null;
  title_ru: string | null;
  excerpt_en: string | null;
  excerpt_ko: string | null;
  excerpt_zh_tw: string | null;
  excerpt_zh_cn: string | null;
  excerpt_ja: string | null;
  excerpt_th: string | null;
  excerpt_mn: string | null;
  excerpt_ru: string | null;
  content_en: string | null;
  content_ko: string | null;
  content_zh_tw: string | null;
  content_zh_cn: string | null;
  content_ja: string | null;
  content_th: string | null;
  content_mn: string | null;
  content_ru: string | null;
  meta_title_en: string | null;
  meta_description_en: string | null;
  category: string | null;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  cover_image_url: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  generation_metadata: Record<string, unknown> | null;
  // Keyword info from join
  keyword?: string | null;
  keyword_locale?: string | null;
}

interface Stats {
  total: number;
  draft: number;
  review: number;
  published: number;
  archived: number;
  totalViews: number;
}

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  ja: '日本語',
  th: 'ภาษาไทย',
  mn: 'Монгол',
  ru: 'Русский',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200';

export default function ContentPage() {
  const params = useParams();
  const currentLocale = params.locale as string || 'en';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    draft: 0,
    review: 0,
    published: 0,
    archived: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [deletePost, setDeletePost] = useState<BlogPost | null>(null);
  const [feedbackPost, setFeedbackPost] = useState<BlogPost | null>(null);
  const [previewLocale, setPreviewLocale] = useState('en');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const response = await fetch(`/api/content?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, fetchPosts]);

  const handleStatusChange = async (postId: string, newStatus: string) => {
    setActionLoading(postId);
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert('Failed to update status: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deletePost) return;

    setActionLoading(deletePost.id);
    try {
      const response = await fetch(`/api/content?id=${deletePost.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setDeletePost(null);
        fetchPosts();
      } else {
        alert('Failed to delete: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
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
        fetchPosts();
      } else {
        alert('Failed to save: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    } finally {
      setActionLoading(null);
    }
  };

  const getPostTitle = (post: BlogPost, locale: string = 'en'): string => {
    const localeKey = `title_${locale.replace('-', '_').toLowerCase()}` as keyof BlogPost;
    return (post[localeKey] as string) || post.title_en || 'Untitled';
  };

  const getPostContent = (post: BlogPost, locale: string = 'en'): string => {
    const localeKey = `content_${locale.replace('-', '_').toLowerCase()}` as keyof BlogPost;
    return (post[localeKey] as string) || post.content_en || '';
  };

  const getPostExcerpt = (post: BlogPost, locale: string = 'en'): string => {
    const localeKey = `excerpt_${locale.replace('-', '_').toLowerCase()}` as keyof BlogPost;
    return (post[localeKey] as string) || post.excerpt_en || '';
  };

  const getAvailableLocales = (post: BlogPost): string[] => {
    const locales: string[] = [];
    const localeKeys = ['en', 'ko', 'zh_tw', 'zh_cn', 'ja', 'th', 'mn', 'ru'];

    for (const locale of localeKeys) {
      const contentKey = `content_${locale}` as keyof BlogPost;
      if (post[contentKey]) {
        locales.push(locale.replace('_', '-'));
      }
    }

    return locales;
  };

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <Clock className="h-4 w-4 text-gray-500" />,
    review: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    published: <CheckCircle className="h-4 w-4 text-green-500" />,
    archived: <Archive className="h-4 w-4 text-gray-400" />,
  };

  const statusBadges: Record<string, 'secondary' | 'outline' | 'default' | 'destructive'> = {
    draft: 'secondary',
    review: 'outline',
    published: 'default',
    archived: 'secondary',
  };

  const getQualityScore = (post: BlogPost): number => {
    const metadata = post.generation_metadata as { qualityScore?: number } | null;
    return metadata?.qualityScore || 0;
  };

  const getKeywordInfo = (post: BlogPost): { keyword: string; locale: string } | null => {
    const metadata = post.generation_metadata as { keyword?: string; sourceLocale?: string; locale?: string } | null;
    if (metadata?.keyword) {
      return { keyword: metadata.keyword, locale: metadata.locale || metadata.sourceLocale || 'en' };
    }
    return null;
  };

  // Get published URL
  const getPublishedUrl = (post: BlogPost): string | null => {
    if (post.status === 'published' && post.slug) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://getcarekorea.com';
      return `${baseUrl}/${currentLocale}/blog/${post.slug}`;
    }
    return null;
  };

  // Handle feedback submission with regeneration
  const handleFeedbackSubmit = async (regenerate: boolean) => {
    if (!feedbackPost) return;

    if (regenerate && !feedbackText.trim()) {
      alert('피드백 내용을 입력해주세요.');
      return;
    }

    setFeedbackLoading(true);
    try {
      if (regenerate) {
        // Submit feedback and regenerate content
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
          alert('피드백이 반영되어 콘텐츠가 재생성되었습니다.');
          setFeedbackPost(null);
          setFeedbackText('');
          fetchPosts();
        } else {
          alert('피드백 반영 실패: ' + (data.error || data.message));
        }
      } else {
        // Direct publish without feedback
        await handlePublish(feedbackPost.id);
        setFeedbackPost(null);
        setFeedbackText('');
      }
    } catch (error) {
      console.error('Feedback error:', error);
      alert('피드백 처리 중 오류가 발생했습니다.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Handle direct publish - Updates blog_posts table directly
  const handlePublish = async (postId: string) => {
    setPublishLoading(postId);
    try {
      // Update blog_posts status to 'published' using the existing content API
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          status: 'published',
          published_at: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        const post = posts.find(p => p.id === postId);
        const publishedUrl = post ? `${window.location.origin}/${currentLocale}/blog/${post.slug}` : '';
        alert(`발행 완료!${publishedUrl ? `\n링크: ${publishedUrl}` : ''}`);
        fetchPosts();
      } else {
        alert('발행 실패: ' + (data.error?.message || data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('발행 중 오류가 발생했습니다.');
    } finally {
      setPublishLoading(null);
    }
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(currentLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format category name
  const formatCategoryName = (category: string): string => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate read time
  const getReadTime = (content: string | null): string => {
    if (!content) return '1 min read';
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  // Render markdown content as HTML
  const renderContent = (content: string): string => {
    return content
      .replace(/\n/g, '<br />')
      .replace(/#{3} (.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
      .replace(/#{2} (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/#{1} (.*)/g, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/- (.*?)(<br \/>|$)/g, '<li class="ml-4">$1</li>')
      || '<p>No content available.</p>';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">
            Manage AI-generated articles and blog posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPosts} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => window.location.href = `/${currentLocale}/admin/keywords`}>
            <Plus className="mr-2 h-4 w-4" />
            Generate from Keywords
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.review}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Content ({stats.total})</TabsTrigger>
          <TabsTrigger value="review" className="text-yellow-600">
            Needs Review ({stats.review})
          </TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({stats.draft})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="plastic-surgery">Plastic Surgery</SelectItem>
                <SelectItem value="dermatology">Dermatology</SelectItem>
                <SelectItem value="dental">Dental</SelectItem>
                <SelectItem value="health-checkup">Health Checkup</SelectItem>
                <SelectItem value="medical-tourism">Medical Tourism</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Articles Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published URL</TableHead>
                  <TableHead className="text-center">Preview</TableHead>
                  <TableHead className="text-center">Feedback</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No articles found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Generate content from the Keywords page to get started.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.location.href = `/${currentLocale}/admin/keywords`}
                      >
                        Go to Keywords
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="rounded bg-muted p-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[250px]">
                              {getPostTitle(post)}
                            </p>
                            <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                              /{post.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getKeywordInfo(post) ? (
                          <div className="flex items-center gap-1">
                            <Key className="h-3 w-3 text-violet-500" />
                            <span className="text-sm font-medium text-violet-700 max-w-[120px] truncate">
                              {getKeywordInfo(post)?.keyword}
                            </span>
                            <Badge variant="outline" className="text-xs ml-1">
                              {getKeywordInfo(post)?.locale.toUpperCase()}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.category || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {getAvailableLocales(post).map((locale) => (
                            <Badge key={locale} variant="secondary" className="text-xs">
                              {locale.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcons[post.status]}
                          <Badge variant={statusBadges[post.status]}>
                            {post.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPublishedUrl(post) ? (
                          <div className="flex items-center gap-1">
                            <a
                              href={getPublishedUrl(post)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:text-violet-800 text-sm truncate max-w-[150px] flex items-center gap-1"
                            >
                              <LinkIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{post.slug}</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewPost(post);
                            setPreviewLocale(getAvailableLocales(post)[0] || 'en');
                          }}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          미리보기
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {post.status !== 'published' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFeedbackPost(post);
                              setPreviewLocale(getAvailableLocales(post)[0] || 'en');
                            }}
                            className="gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            피드백
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">발행됨</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionLoading === post.id}
                            >
                              {actionLoading === post.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setPreviewPost(post);
                              setPreviewLocale(getAvailableLocales(post)[0] || 'en');
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditPost(post)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {post.status === 'published' && (
                              <DropdownMenuItem onClick={() => window.open(`/${currentLocale}/blog/${post.slug}`, '_blank')}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Live
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {post.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'review')}>
                                <Send className="mr-2 h-4 w-4" />
                                Submit for Review
                              </DropdownMenuItem>
                            )}
                            {post.status === 'review' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(post.id, 'published')}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve & Publish
                              </DropdownMenuItem>
                            )}
                            {post.status === 'review' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'draft')}>
                                <Clock className="mr-2 h-4 w-4" />
                                Return to Draft
                              </DropdownMenuItem>
                            )}
                            {post.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'archived')}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeletePost(post)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card className="p-6">
            {posts.filter(p => p.status === 'review').length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No articles pending review
              </p>
            ) : (
              <div className="space-y-4">
                {posts.filter(p => p.status === 'review').map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{getPostTitle(post)}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewPost(post);
                          setPreviewLocale(getAvailableLocales(post)[0] || 'en');
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusChange(post.id, 'published')}
                        disabled={actionLoading === post.id}
                      >
                        {actionLoading === post.id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve & Publish
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
            {posts.filter(p => p.status === 'draft').length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No draft articles
              </p>
            ) : (
              <div className="space-y-4">
                {posts.filter(p => p.status === 'draft').map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{getPostTitle(post)}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditPost(post)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusChange(post.id, 'review')}
                        disabled={actionLoading === post.id}
                      >
                        {actionLoading === post.id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Submit for Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full Screen Blog-Style Preview Modal */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] p-0 m-0 rounded-none">
          {previewPost && (
            <div className="h-full overflow-y-auto bg-background">
              {/* Preview Header Bar */}
              <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="container flex items-center justify-between h-14 px-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewPost(null)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Content
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Select value={previewLocale} onValueChange={setPreviewLocale}>
                        <SelectTrigger className="w-[160px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableLocales(previewPost).map((locale) => (
                            <SelectItem key={locale} value={locale}>
                              {LOCALE_LABELS[locale] || locale.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Responsive View Toggle */}
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                      <Button
                        variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setPreviewMode('desktop')}
                        title="Desktop view"
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setPreviewMode('tablet')}
                        title="Tablet view"
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setPreviewMode('mobile')}
                        title="Mobile view"
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadges[previewPost.status]} className="mr-2">
                      {previewPost.status.toUpperCase()}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditPost(previewPost);
                        setPreviewPost(null);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    {previewPost.status !== 'published' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          handleStatusChange(previewPost.id, 'published');
                          setPreviewPost(null);
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                    )}
                    {previewPost.status === 'published' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${previewLocale}/blog/${previewPost.slug}`, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Live
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewPost(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Blog Preview Content - Mimics actual blog page */}
              <div
                className={`min-h-screen bg-background mx-auto transition-all duration-300 ${
                  previewMode === 'mobile'
                    ? 'max-w-[375px] border-x shadow-lg'
                    : previewMode === 'tablet'
                    ? 'max-w-[768px] border-x shadow-lg'
                    : 'max-w-full'
                }`}
                style={{
                  minHeight: previewMode !== 'desktop' ? 'calc(100vh - 56px)' : undefined,
                }}
              >
                {/* Hero Image */}
                <div className="relative h-[400px] lg:h-[500px]">
                  <Image
                    src={previewPost.cover_image_url || DEFAULT_IMAGE}
                    alt={getPostTitle(previewPost, previewLocale)}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>

                <div className="container relative -mt-32 pb-16">
                  <div className="mx-auto max-w-4xl">
                    {/* Article Header */}
                    <div className="mb-8">
                      <Card className="overflow-hidden border-0 shadow-2xl">
                        <CardContent className="p-8 lg:p-12">
                          {/* URL Preview */}
                          <div className="mb-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Preview URL:</span>{' '}
                              <code className="bg-background px-2 py-1 rounded text-violet-600">
                                {typeof window !== 'undefined' ? window.location.origin : ''}/{previewLocale}/blog/{previewPost.slug}
                              </code>
                            </p>
                          </div>

                          {/* Category & Tags */}
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            {previewPost.category && (
                              <Badge className="bg-violet-500 hover:bg-violet-600">
                                {formatCategoryName(previewPost.category)}
                              </Badge>
                            )}
                            {previewPost.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary">
                                <Tag className="mr-1 h-3 w-3" />
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Title */}
                          <h1 className="mb-6 text-3xl font-bold lg:text-4xl">
                            {getPostTitle(previewPost, previewLocale)}
                          </h1>

                          {/* Excerpt */}
                          {getPostExcerpt(previewPost, previewLocale) && (
                            <p className="mb-6 text-lg text-muted-foreground">
                              {getPostExcerpt(previewPost, previewLocale)}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="mb-6 flex flex-wrap items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  GetCareKorea Team
                                </p>
                              </div>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(previewPost.published_at || previewPost.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {getReadTime(getPostContent(previewPost, previewLocale))}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {previewPost.view_count.toLocaleString()} views
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-3">
                            <Button variant="outline" size="sm" className="rounded-full gap-2">
                              <Heart className="h-4 w-4" />
                              Like
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-full gap-2">
                              <Bookmark className="h-4 w-4" />
                              Save
                            </Button>
                            <div className="ml-auto flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Share:</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Article Content */}
                    <Card className="overflow-hidden border-0 shadow-xl">
                      <CardContent className="p-8 lg:p-12">
                        <div
                          className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary"
                          dangerouslySetInnerHTML={{
                            __html: renderContent(getPostContent(previewPost, previewLocale))
                          }}
                        />
                      </CardContent>
                    </Card>

                    {/* CTA */}
                    <div className="mt-12">
                      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-purple-900/50 to-violet-950/50 p-8">
                        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
                        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

                        <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                            <Sparkles className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="mb-1 text-xl font-bold text-white">Ready to Start Your Journey?</h3>
                            <p className="text-white/70">Get a free consultation with our medical tourism experts.</p>
                          </div>
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                          >
                            Get Free Quote
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quality Score Info */}
                    {getQualityScore(previewPost) > 0 && (
                      <div className="mt-8 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">Quality Score:</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className={`h-full ${
                                  getQualityScore(previewPost) >= 90
                                    ? 'bg-green-500'
                                    : getQualityScore(previewPost) >= 80
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${getQualityScore(previewPost)}%` }}
                              />
                            </div>
                            <span className="font-medium">{getQualityScore(previewPost)}%</span>
                          </div>
                          {getKeywordInfo(previewPost) && (
                            <>
                              <Separator orientation="vertical" className="h-6" />
                              <span className="text-sm text-muted-foreground">
                                Generated from keyword: <strong>{getKeywordInfo(previewPost)?.keyword}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Article
            </DialogTitle>
            <DialogDescription>
              Make changes to the article content
            </DialogDescription>
          </DialogHeader>

          {editPost && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={editPost.slug}
                  onChange={(e) => setEditPost({ ...editPost, slug: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Title (English)</label>
                <Input
                  value={editPost.title_en || ''}
                  onChange={(e) => setEditPost({ ...editPost, title_en: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Excerpt (English)</label>
                <Textarea
                  value={editPost.excerpt_en || ''}
                  onChange={(e) => setEditPost({ ...editPost, excerpt_en: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content (English)</label>
                <Textarea
                  value={editPost.content_en || ''}
                  onChange={(e) => setEditPost({ ...editPost, content_en: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={editPost.category || 'medical-tourism'}
                    onValueChange={(value) => setEditPost({ ...editPost, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plastic-surgery">Plastic Surgery</SelectItem>
                      <SelectItem value="dermatology">Dermatology</SelectItem>
                      <SelectItem value="dental">Dental</SelectItem>
                      <SelectItem value="health-checkup">Health Checkup</SelectItem>
                      <SelectItem value="medical-tourism">Medical Tourism</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editPost.status}
                    onValueChange={(value) => setEditPost({ ...editPost, status: value as BlogPost['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditPost(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={actionLoading === editPost.id}
                >
                  {actionLoading === editPost.id ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Article
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletePost && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{getPostTitle(deletePost)}</p>
                <p className="text-sm text-muted-foreground">/{deletePost.slug}</p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDeletePost(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={actionLoading === deletePost.id}
                >
                  {actionLoading === deletePost.id ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={!!feedbackPost} onOpenChange={() => { setFeedbackPost(null); setFeedbackText(''); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-600" />
              콘텐츠 피드백
            </DialogTitle>
            <DialogDescription>
              콘텐츠를 검토하고 피드백을 제공하거나 바로 발행할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {feedbackPost && (
            <div className="space-y-4">
              {/* Content Preview Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-lg">{getPostTitle(feedbackPost)}</p>
                    <p className="text-sm text-muted-foreground">/{feedbackPost.slug}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewPost(feedbackPost);
                      setFeedbackPost(null);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    전체 미리보기
                  </Button>
                </div>
                {getPostExcerpt(feedbackPost, previewLocale) && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {getPostExcerpt(feedbackPost, previewLocale)}
                  </p>
                )}
                {getKeywordInfo(feedbackPost) && (
                  <div className="flex items-center gap-2 mt-2">
                    <Key className="h-3 w-3 text-violet-500" />
                    <span className="text-sm text-violet-700">
                      키워드: {getKeywordInfo(feedbackPost)?.keyword}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getKeywordInfo(feedbackPost)?.locale.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Feedback Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  피드백 내용 (선택사항)
                </label>
                <Textarea
                  placeholder="개선이 필요한 부분이나 수정 요청 사항을 작성해주세요...&#10;&#10;예시:&#10;- 도입부를 더 간결하게 수정해주세요&#10;- 가격 정보를 업데이트해주세요&#10;- 전문 용어 설명을 추가해주세요"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  피드백은 AI 학습에 활용되어 향후 콘텐츠 품질 개선에 반영됩니다.
                </p>
              </div>

              <Separator />

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setFeedbackPost(null); setFeedbackText(''); }}
                  disabled={feedbackLoading}
                >
                  취소
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleFeedbackSubmit(true)}
                    disabled={feedbackLoading || !feedbackText.trim()}
                    className="gap-2"
                  >
                    {feedbackLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    피드백 반영 후 재생성
                  </Button>
                  <Button
                    onClick={() => handleFeedbackSubmit(false)}
                    disabled={feedbackLoading || publishLoading === feedbackPost.id}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {publishLoading === feedbackPost.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    바로 발행
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
