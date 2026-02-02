'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Globe, Search, Users, FileText, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SEOPreview } from '@/components/admin/SEOPreview';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'mn', name: 'Монгол', flag: '🇲🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

interface Interpreter {
  id: string;
  slug: string;
  name: Record<string, string>;
  bio_short: Record<string, string>;
  photo_url: string | null;
  primary_specialty: string;
  languages: Array<{ code: string; proficiency: string }>;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  locale: string;
  category: string | null;
  status: string;
}

export default function SEOPage() {
  const params = useParams();
  const currentLocale = (params.locale as string) || 'en';
  const t = useTranslations('admin.seo');

  const [activeTab, setActiveTab] = useState('interpreters');
  const [interpreters, setInterpreters] = useState<Interpreter[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch interpreters (use admin API to get raw JSONB data)
  useEffect(() => {
    async function fetchInterpreters() {
      try {
        const response = await fetch('/api/admin/interpreters?limit=100');
        const data = await response.json();
        if (data.success) {
          setInterpreters(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch interpreters:', error);
      }
    }
    fetchInterpreters();
  }, []);

  // Fetch blog posts
  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        const response = await fetch('/api/content?limit=100&status=published');
        const data = await response.json();
        if (data.success) {
          setBlogPosts(data.data.posts || []);
        }
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogPosts();
  }, []);

  const selectedInterpreter = interpreters.find((i) => i.id === selectedItem);
  const selectedBlogPost = blogPosts.find((p) => p.id === selectedItem);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-violet-600" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Users className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{interpreters.length}</p>
                <p className="text-sm text-muted-foreground">{t('stats.interpreters')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blogPosts.length}</p>
                <p className="text-sm text-muted-foreground">{t('stats.blogPosts')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{locales.length}</p>
                <p className="text-sm text-muted-foreground">{t('stats.locales')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t('selectItem')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedItem(null); }}>
              <TabsList className="w-full">
                <TabsTrigger value="interpreters" className="flex-1">
                  <Users className="h-4 w-4 mr-1" />
                  {t('tabs.interpreters')}
                </TabsTrigger>
                <TabsTrigger value="blog" className="flex-1">
                  <FileText className="h-4 w-4 mr-1" />
                  {t('tabs.blog')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="interpreters" className="mt-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {interpreters.map((interpreter) => (
                      <button
                        key={interpreter.id}
                        onClick={() => setSelectedItem(interpreter.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedItem === interpreter.id
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-transparent hover:bg-muted'
                        }`}
                      >
                        <p className="font-medium truncate">
                          {interpreter.name?.en || interpreter.name?.ko || 'Unnamed'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          /{interpreter.slug}
                        </p>
                      </button>
                    ))}
                    {interpreters.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        {t('noInterpreters')}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="blog" className="mt-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {blogPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedItem(post.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedItem === post.id
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {post.locale}
                          </Badge>
                          <p className="font-medium truncate flex-1">{post.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          /{post.slug}
                        </p>
                      </button>
                    ))}
                    {blogPosts.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        {t('noBlogPosts')}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* SEO Preview */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            activeTab === 'interpreters' && selectedInterpreter ? (
              <SEOPreview
                type="interpreter"
                data={{
                  name: selectedInterpreter.name,
                  bio_short: selectedInterpreter.bio_short,
                  photo_url: selectedInterpreter.photo_url || undefined,
                  slug: selectedInterpreter.slug,
                  primary_specialty: selectedInterpreter.primary_specialty,
                  languages: selectedInterpreter.languages,
                }}
                defaultLocale={currentLocale}
              />
            ) : activeTab === 'blog' && selectedBlogPost ? (
              <SEOPreview
                type="blog"
                data={{
                  title: selectedBlogPost.title,
                  excerpt: selectedBlogPost.excerpt || undefined,
                  cover_image_url: selectedBlogPost.cover_image_url || undefined,
                  slug: selectedBlogPost.slug,
                  locale: selectedBlogPost.locale,
                  category: selectedBlogPost.category || undefined,
                }}
                defaultLocale={selectedBlogPost.locale || 'en'}
              />
            ) : null
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{t('selectItemPrompt')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
