import { setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { KeywordsTable } from './KeywordsTable';

interface PageProps {
  params: Promise<{ locale: string }>;
}

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

async function getKeywords(): Promise<{ keywords: Keyword[]; categories: string[] }> {
  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('content_keywords') as any)
    .select(`
      *,
      blog_posts (
        id,
        slug,
        title_en,
        status
      )
    `)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('Error fetching keywords:', error);
    return { keywords: [], categories: [] };
  }

  const keywords = (data || []) as Keyword[];

  // Extract unique categories
  const categories = [...new Set(keywords.map(k => k.category).filter(Boolean))];

  return { keywords, categories };
}

export default async function KeywordsAdminPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { keywords, categories } = await getKeywords();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keyword Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage SEO keywords and AI content generation
          </p>
        </div>
      </div>

      <KeywordsTable
        keywords={keywords}
        categories={categories}
        totalCount={keywords.length}
      />
    </div>
  );
}
