'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Save,
  Loader2,
  LayoutGrid,
  MessageCircle,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { clearCTACache } from '@/lib/settings/cta';

interface PaginationSettings {
  interpreters_per_page: number;
  hospitals_per_page: number;
  blog_posts_per_page: number;
  procedures_per_page: number;
}

interface CTAConfig {
  type: 'whatsapp' | 'line' | 'kakao' | 'telegram';
  url: string;
  text: string;
  color: string;
}

interface CTASettings {
  [locale: string]: CTAConfig;
}

const LOCALES = ['en', 'ko', 'ja', 'zh-TW', 'zh-CN', 'th', 'mn', 'ru'];
const LOCALE_NAMES: Record<string, string> = {
  'en': 'English',
  'ko': '한국어',
  'ja': '日本語',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'th': 'ไทย',
  'mn': 'Монгол',
  'ru': 'Русский',
};

const MESSENGER_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp', color: 'from-green-500 to-green-600' },
  { value: 'line', label: 'LINE', color: 'from-green-400 to-green-500' },
  { value: 'kakao', label: 'KakaoTalk', color: 'from-yellow-400 to-yellow-500' },
  { value: 'telegram', label: 'Telegram', color: 'from-blue-400 to-blue-500' },
];

export default function SystemSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Separate saving states for each section
  const [savingPagination, setSavingPagination] = useState(false);
  const [savingCTA, setSavingCTA] = useState(false);
  const [paginationStatus, setPaginationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ctaStatus, setCtaStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [pagination, setPagination] = useState<PaginationSettings>({
    interpreters_per_page: 16,
    hospitals_per_page: 12,
    blog_posts_per_page: 10,
    procedures_per_page: 12,
  });

  const [ctaLinks, setCtaLinks] = useState<CTASettings>({});
  const [selectedLocale, setSelectedLocale] = useState('en');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      // Load pagination settings via API
      const paginationRes = await fetch('/api/admin/settings?key=pagination');
      const paginationJson = await paginationRes.json();
      if (paginationJson.success && paginationJson.data?.value) {
        setPagination(paginationJson.data.value as PaginationSettings);
      }

      // Load CTA settings via API
      const ctaRes = await fetch('/api/admin/settings?key=cta_links');
      const ctaJson = await ctaRes.json();
      if (ctaJson.success && ctaJson.data?.value) {
        setCtaLinks(ctaJson.data.value as CTASettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function savePagination() {
    setSavingPagination(true);
    setPaginationStatus('idle');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'pagination',
          value: pagination,
          description: 'Pagination size settings for various list pages',
          category: 'ui',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save pagination');
      }

      setPaginationStatus('success');
      setTimeout(() => setPaginationStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save pagination:', error);
      setPaginationStatus('error');
    } finally {
      setSavingPagination(false);
    }
  }

  async function saveCTA() {
    setSavingCTA(true);
    setCtaStatus('idle');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'cta_links',
          value: ctaLinks,
          description: 'CTA messenger links per locale',
          category: 'marketing',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save CTA settings');
      }

      // Clear the CTA cache so changes take effect immediately
      clearCTACache();

      setCtaStatus('success');
      setTimeout(() => setCtaStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save CTA:', error);
      setCtaStatus('error');
    } finally {
      setSavingCTA(false);
    }
  }

  function updateCTA(locale: string, field: keyof CTAConfig, value: string) {
    setCtaLinks(prev => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: value,
        // Auto-update color based on type
        ...(field === 'type' && {
          color: MESSENGER_TYPES.find(m => m.value === value)?.color || prev[locale]?.color,
        }),
      },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentCTA = ctaLinks[selectedLocale] || {
    type: 'whatsapp',
    url: '',
    text: '',
    color: 'from-green-500 to-green-600',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Settings
        </h1>
        <p className="text-muted-foreground">Configure pagination and CTA settings</p>
      </div>

      {/* Pagination Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Pagination Settings
            </CardTitle>
            <CardDescription>
              Configure how many items to show per page on list pages
            </CardDescription>
          </div>
          <Button onClick={savePagination} disabled={savingPagination} size="sm" className="gap-2">
            {savingPagination ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : paginationStatus === 'success' ? (
              <Check className="h-4 w-4" />
            ) : paginationStatus === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {savingPagination ? 'Saving...' : paginationStatus === 'success' ? 'Saved!' : 'Save'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="interpreters">Interpreters per page</Label>
              <Input
                id="interpreters"
                type="number"
                min={4}
                max={50}
                value={pagination.interpreters_per_page}
                onChange={(e) => setPagination(prev => ({
                  ...prev,
                  interpreters_per_page: parseInt(e.target.value) || 16,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hospitals">Hospitals per page</Label>
              <Input
                id="hospitals"
                type="number"
                min={4}
                max={50}
                value={pagination.hospitals_per_page}
                onChange={(e) => setPagination(prev => ({
                  ...prev,
                  hospitals_per_page: parseInt(e.target.value) || 12,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog">Blog posts per page</Label>
              <Input
                id="blog"
                type="number"
                min={4}
                max={50}
                value={pagination.blog_posts_per_page}
                onChange={(e) => setPagination(prev => ({
                  ...prev,
                  blog_posts_per_page: parseInt(e.target.value) || 10,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="procedures">Procedures per page</Label>
              <Input
                id="procedures"
                type="number"
                min={4}
                max={50}
                value={pagination.procedures_per_page}
                onChange={(e) => setPagination(prev => ({
                  ...prev,
                  procedures_per_page: parseInt(e.target.value) || 12,
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              CTA Links by Locale
            </CardTitle>
            <CardDescription>
              Configure messenger CTA buttons for each language
            </CardDescription>
          </div>
          <Button onClick={saveCTA} disabled={savingCTA} size="sm" className="gap-2">
            {savingCTA ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : ctaStatus === 'success' ? (
              <Check className="h-4 w-4" />
            ) : ctaStatus === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {savingCTA ? 'Saving...' : ctaStatus === 'success' ? 'Saved!' : 'Save'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Locale Selector */}
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((locale) => (
              <Button
                key={locale}
                variant={selectedLocale === locale ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLocale(locale)}
                className="min-w-[80px]"
              >
                {LOCALE_NAMES[locale]}
              </Button>
            ))}
          </div>

          {/* CTA Editor for Selected Locale */}
          <div className="rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold text-lg">
              {LOCALE_NAMES[selectedLocale]} ({selectedLocale})
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Messenger Type</Label>
                <Select
                  value={currentCTA.type}
                  onValueChange={(value) => updateCTA(selectedLocale, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSENGER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  placeholder="Chat on WhatsApp"
                  value={currentCTA.text}
                  onChange={(e) => updateCTA(selectedLocale, 'text', e.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>URL</Label>
                <Input
                  placeholder="https://wa.me/821012345678"
                  value={currentCTA.url}
                  onChange={(e) => updateCTA(selectedLocale, 'url', e.target.value)}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t">
              <Label className="text-sm text-muted-foreground mb-2 block">Preview</Label>
              <a
                href={currentCTA.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${currentCTA.color} px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105`}
              >
                <MessageCircle className="h-5 w-5" />
                {currentCTA.text || 'Chat Now'}
              </a>
            </div>
          </div>

          {/* Quick Overview */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-medium mb-3">All Locales Overview</h4>
            <div className="grid gap-2 text-sm">
              {LOCALES.map((locale) => {
                const cta = ctaLinks[locale];
                return (
                  <div key={locale} className="flex items-center justify-between py-1 border-b last:border-0">
                    <span className="font-medium">{LOCALE_NAMES[locale]}</span>
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      {cta ? `${cta.type} - ${cta.url || 'No URL'}` : 'Not configured'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
