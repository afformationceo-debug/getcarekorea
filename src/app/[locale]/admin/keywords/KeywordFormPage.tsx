'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
}

interface KeywordFormPageProps {
  keyword?: Keyword;
}

const CATEGORY_KEYS = [
  'plastic-surgery',
  'dermatology',
  'dental',
  'health-checkup',
  'ophthalmology',
  'orthopedics',
  'general',
];

const LOCALE_CODES = ['en', 'ko', 'zh-TW', 'zh-CN', 'ja', 'th', 'mn', 'ru'];

export function KeywordFormPage({ keyword }: KeywordFormPageProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('admin.keywords');
  const tContent = useTranslations('admin.content');

  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    keyword: keyword?.keyword || '',
    category: keyword?.category || 'general',
    locale: keyword?.locale || 'en',
    search_volume: keyword?.search_volume?.toString() || '',
    competition: keyword?.competition || '',
    priority: keyword?.priority?.toString() || '1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.keyword.trim()) {
      toast.warning(t('form.keywordRequired'));
      return;
    }

    setIsLoading(true);

    const data = {
      keyword: formData.keyword.trim(),
      category: formData.category || 'general',
      locale: formData.locale,
      search_volume: formData.search_volume ? parseInt(formData.search_volume) : null,
      competition: formData.competition || null,
      priority: parseInt(formData.priority) || 1,
    };

    try {
      const url = keyword
        ? `/api/keywords/${keyword.id}`
        : '/api/keywords';

      const response = await fetch(url, {
        method: keyword ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(keyword ? t('form.keywordUpdated') : t('form.keywordCreated'));
        router.push(`/${locale}/admin/keywords`);
        router.refresh();
      } else {
        const errorMessage = result.error?.message || result.message || 'Unknown error';
        toast.error(`${t('form.saveFailed')}: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving keyword:', error);
      toast.error(t('form.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.title')}</CardTitle>
              <CardDescription>{t('form.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keyword">{t('form.keyword')} *</Label>
                <Input
                  id="keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder={t('form.keywordPlaceholder')}
                  className="mt-1.5"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('form.keywordHint')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">{t('form.category')}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category" className="mt-1.5">
                      <SelectValue placeholder={t('form.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_KEYS.map((catKey) => (
                        <SelectItem key={catKey} value={catKey}>
                          {t(`categories.${catKey}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="locale">{t('form.targetLocale')}</Label>
                  <Select
                    value={formData.locale}
                    onValueChange={(value) => setFormData({ ...formData, locale: value })}
                  >
                    <SelectTrigger id="locale" className="mt-1.5">
                      <SelectValue placeholder={t('form.selectLocale')} />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCALE_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {tContent(`languages.${code}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.seoMetrics')}</CardTitle>
              <CardDescription>{t('form.seoMetricsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search_volume">{t('form.searchVolume')}</Label>
                  <Input
                    id="search_volume"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.search_volume}
                    onChange={(e) => setFormData({ ...formData, search_volume: e.target.value })}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('form.monthlyVolume')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="competition">{t('form.competition')}</Label>
                  <Input
                    id="competition"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.5"
                    value={formData.competition}
                    onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('form.competitionHint')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="priority">{t('form.priority')}</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('form.priorityHint')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Info (for edit mode) */}
          {keyword && (
            <Card>
              <CardHeader>
                <CardTitle>{t('form.status')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('form.currentStatus')}</span>
                  <span className={`text-sm font-medium capitalize ${
                    keyword.status === 'published' ? 'text-green-600' :
                    keyword.status === 'generated' ? 'text-yellow-600' :
                    keyword.status === 'generating' ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {keyword.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('form.created')}</span>
                  <span className="text-sm">
                    {new Date(keyword.created_at).toLocaleDateString()}
                  </span>
                </div>
                {keyword.blog_post_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('form.blogPost')}</span>
                    <span className="text-sm text-green-600">{t('form.linked')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                  {keyword ? t('form.saveChanges') : t('form.createKeyword')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/admin/keywords`)}
                >
                  {t('form.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
