'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export function KeywordFormPage({ keyword }: KeywordFormPageProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

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
      toast.warning('Keyword is required');
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
        toast.success(keyword ? 'Keyword updated' : 'Keyword created');
        router.push(`/${locale}/admin/keywords`);
        router.refresh();
      } else {
        const errorMessage = result.error?.message || result.message || 'Unknown error';
        toast.error(`Failed to save: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving keyword:', error);
      toast.error('Failed to save keyword');
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
              <CardTitle>Keyword Information</CardTitle>
              <CardDescription>Enter the keyword details for SEO content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keyword">Keyword *</Label>
                <Input
                  id="keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="e.g., best rhinoplasty korea"
                  className="mt-1.5"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The main keyword for SEO content generation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category" className="mt-1.5">
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
                  <Label htmlFor="locale">Target Locale</Label>
                  <Select
                    value={formData.locale}
                    onValueChange={(value) => setFormData({ ...formData, locale: value })}
                  >
                    <SelectTrigger id="locale" className="mt-1.5">
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
              </div>
            </CardContent>
          </Card>

          {/* SEO Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Metrics</CardTitle>
              <CardDescription>Optional metrics for prioritization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search_volume">Search Volume</Label>
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
                    Monthly search volume
                  </p>
                </div>
                <div>
                  <Label htmlFor="competition">Competition (0-1)</Label>
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
                    0 = Low, 1 = High
                  </p>
                </div>
                <div>
                  <Label htmlFor="priority">Priority (1-10)</Label>
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
                    Higher = more urgent
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
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Status</span>
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
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(keyword.created_at).toLocaleDateString()}
                  </span>
                </div>
                {keyword.blog_post_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Blog Post</span>
                    <span className="text-sm text-green-600">Linked</span>
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
                  {keyword ? 'Save Changes' : 'Create Keyword'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/admin/keywords`)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
