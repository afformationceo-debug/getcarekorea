import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createAdminClient } from '@/lib/supabase/server';
import { KeywordFormPage } from '../KeywordFormPage';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
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
}

async function getKeyword(id: string): Promise<Keyword | null> {
  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('content_keywords') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Keyword;
}

export default async function KeywordDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const keyword = await getKeyword(id);

  if (!keyword) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/keywords`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Keyword</h1>
          <p className="text-muted-foreground text-sm">
            {keyword.keyword} · {keyword.locale.toUpperCase()}
          </p>
        </div>
      </div>

      <KeywordFormPage keyword={keyword} />
    </div>
  );
}
