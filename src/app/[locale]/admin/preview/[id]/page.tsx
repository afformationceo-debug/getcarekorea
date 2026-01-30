'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/lib/i18n/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Edit,
  Send,
  Check,
  MessageSquare,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContentDraft {
  id: string;
  keyword_text: string;
  locale: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  author_name: string;
  author_name_en: string;
  author_bio: string;
  author_years_experience: number;
  tags: string[];
  faq_schema: { question: string; answer: string }[];
  images: { url: string; alt: string; placeholder?: string }[];
  cover_image_url: string | null;
  status: string;
  hreflang_group: string;
  created_at: string;
  updated_at: string;
}

const LOCALES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'mn', label: 'Монгол', flag: '🇲🇳' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '375px', label: 'Mobile' },
};

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = params.id as string;
  const selectedLocale = searchParams.get('locale') || 'ko';

  const [content, setContent] = useState<ContentDraft | null>(null);
  const [relatedContent, setRelatedContent] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | 'edit'>('edit');
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [id, selectedLocale]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content/draft/${id}?locale=${selectedLocale}`);

      if (!response.ok) throw new Error('Failed to fetch content');

      const data = await response.json();
      setContent(data.content);

      // Fetch related content in same hreflang group
      if (data.content?.hreflang_group) {
        const relatedRes = await fetch(
          `/api/content/drafts?hreflang_group=${data.content.hreflang_group}&exclude=${id}`
        );
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          setRelatedContent(relatedData.drafts || []);
        }
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocaleChange = (newLocale: string) => {
    // Find content in same hreflang group with new locale
    const related = relatedContent.find(c => c.locale === newLocale);
    if (related) {
      router.push(`/admin/preview/${related.id}?locale=${newLocale}`);
    }
  };

  const handleFeedback = async () => {
    if (!feedbackText.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/content/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentDraftId: id,
          feedbackText,
          feedbackType,
          regenerate: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setFeedbackOpen(false);
      setFeedbackText('');
      alert('피드백이 제출되었습니다. 콘텐츠가 재생성됩니다.');
      fetchContent();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('피드백 제출 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('이 콘텐츠를 발행하시겠습니까?')) return;

    try {
      setPublishing(true);
      const response = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentDraftId: id,
          publishAll: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to publish');

      const data = await response.json();
      alert(`발행 완료!\nURL: ${data.url}`);
      fetchContent();
    } catch (error) {
      console.error('Error publishing:', error);
      alert('발행 실패');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">콘텐츠를 찾을 수 없습니다.</p>
        <Button asChild>
          <Link href="/admin/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Link>
        </Button>
      </div>
    );
  }

  const availableLocales = [content.locale, ...relatedContent.map(c => c.locale)];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/content">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                    {content.status}
                  </Badge>
                  <span className="text-sm font-medium truncate max-w-[300px]">
                    {content.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {content.keyword_text} • {content.category}
                </p>
              </div>
            </div>

            {/* Center - Viewport & Locale */}
            <div className="flex items-center gap-2">
              {/* Viewport Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewport('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewport === 'tablet' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewport('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewport('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* Locale Selector */}
              <Select value={selectedLocale} onValueChange={handleLocaleChange}>
                <SelectTrigger className="w-[140px]">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((locale) => (
                    <SelectItem
                      key={locale.code}
                      value={locale.code}
                      disabled={!availableLocales.includes(locale.code)}
                    >
                      <span className="flex items-center gap-2">
                        <span>{locale.flag}</span>
                        <span>{locale.label}</span>
                        {!availableLocales.includes(locale.code) && (
                          <span className="text-xs text-muted-foreground">(없음)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setFeedbackOpen(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                피드백
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/content/edit/${id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  편집
                </Link>
              </Button>

              {content.status !== 'published' && (
                <Button size="sm" onClick={handlePublish} disabled={publishing}>
                  {publishing ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  발행
                </Button>
              )}

              {content.status === 'published' && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/${content.locale}/blog/${id}`} target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    보기
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div
            className="bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            style={{
              width: VIEWPORT_SIZES[viewport].width,
              maxWidth: '100%',
            }}
          >
            {/* Preview Banner */}
            <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-sm text-center">
              <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                📋 미리보기 모드 - {VIEWPORT_SIZES[viewport].label}
              </span>
            </div>

            {/* Article Content */}
            <article className="p-6 lg:p-8">
              {/* Author Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {content.author_name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{content.author_name || content.author_name_en}</p>
                  <p className="text-sm text-muted-foreground">
                    {content.author_years_experience}년 경력 의료통역사
                  </p>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{content.title}</h1>

              {/* Excerpt */}
              <p className="text-lg text-muted-foreground mb-6">{content.excerpt}</p>

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {content.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Main Content */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none blog-content"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />

              {/* FAQ Section */}
              {content.faq_schema && content.faq_schema.length > 0 && (
                <div className="mt-12 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-6">자주 묻는 질문</h2>
                  <div className="space-y-4">
                    {content.faq_schema.map((faq, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium">
                            Q. {faq.question}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Meta Info */}
            <div className="border-t bg-muted/50 p-6">
              <h3 className="font-semibold mb-4">SEO 메타 정보</h3>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Meta Title</dt>
                  <dd className="font-medium">{content.meta_title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Meta Description</dt>
                  <dd className="font-medium">{content.meta_description}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">hreflang Group</dt>
                  <dd className="font-medium">{content.hreflang_group || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>피드백 주기</DialogTitle>
            <DialogDescription>
              피드백을 작성하면 AI가 학습하여 콘텐츠를 재생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>피드백 유형</Label>
              <Select value={feedbackType} onValueChange={(v: 'positive' | 'negative' | 'edit') => setFeedbackType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      긍정적 피드백 (이 부분 유지)
                    </span>
                  </SelectItem>
                  <SelectItem value="negative">
                    <span className="flex items-center gap-2">
                      <span className="text-red-500">✕</span>
                      부정적 피드백 (개선 필요)
                    </span>
                  </SelectItem>
                  <SelectItem value="edit">
                    <span className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-blue-500" />
                      수정 요청 (구체적 변경)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>피드백 내용</Label>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="예: 수술 후 관리 방법을 더 상세히 설명해주세요."
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handlePublish}
              variant="secondary"
              disabled={publishing}
            >
              {publishing ? <LoadingSpinner size="sm" /> : null}
              피드백 없이 발행
            </Button>
            <Button onClick={handleFeedback} disabled={submitting || !feedbackText.trim()}>
              {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              피드백 반영 후 재생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
