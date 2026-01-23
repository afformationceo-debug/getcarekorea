import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ProcedureDetailClient } from './ProcedureDetailClient';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ProcedureDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const supabase = await createAdminClient();

  // Fetch procedure from DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proc, error } = await (supabase.from('procedures') as any)
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !proc) {
    notFound();
  }

  // Get locale field suffix
  const localeSuffix = locale.replace('-', '_').toLowerCase();

  // Get related hospitals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hospitalLinks } = await (supabase.from('hospital_procedures') as any)
    .select(`
      hospital_id,
      price_range,
      is_featured,
      hospitals (
        id,
        slug,
        name_en,
        name_ko,
        name_ja,
        name_zh_cn,
        name_zh_tw,
        cover_image_url,
        city,
        avg_rating,
        review_count,
        certifications,
        languages
      )
    `)
    .eq('procedure_id', proc.id);

  const hospitals = (hospitalLinks || [])
    .filter((link: Record<string, unknown>) => link.hospitals)
    .map((link: Record<string, unknown>) => {
      const h = link.hospitals as Record<string, unknown>;
      return {
        id: h.id as string,
        slug: h.slug as string,
        name: (h[`name_${localeSuffix}`] || h.name_en) as string,
        cover_image_url: h.cover_image_url as string | null,
        city: h.city as string,
        avg_rating: h.avg_rating as number,
        review_count: h.review_count as number,
        certifications: h.certifications as string[],
        languages: h.languages as string[],
        price_range: link.price_range as string | null,
        is_featured: link.is_featured as boolean,
      };
    });

  // Get related blog posts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: blogPosts } = await (supabase.from('blog_posts') as any)
    .select('id, slug, title_en, title_ko, title_ja, featured_image, created_at')
    .eq('status', 'published')
    .contains('tags', [proc.category])
    .order('created_at', { ascending: false })
    .limit(4);

  const relatedPosts = (blogPosts || []).map((post: Record<string, unknown>) => ({
    id: post.id,
    slug: post.slug,
    title: post[`title_${localeSuffix}`] || post.title_en,
    featured_image: post.featured_image,
    created_at: post.created_at,
  }));

  const procedure = {
    id: proc.id as string,
    slug: proc.slug as string,
    category: proc.category as string,
    name: (proc[`name_${localeSuffix}`] || proc.name_en) as string,
    description: (proc[`description_${localeSuffix}`] || proc.description_en) as string,
    short_description: (proc[`short_description_${localeSuffix}`] || proc.short_description_en) as string,
    image_url: proc.image_url as string | null,
    price_range_usd: proc.price_range_usd as string | null,
    duration_minutes: proc.duration_minutes as number | null,
    recovery_days: proc.recovery_days as string | null,
    popularity_score: proc.popularity_score as number,
    is_featured: proc.is_featured as boolean,
    faq: (proc[`faq_${localeSuffix}`] || proc.faq_en) as Array<{ q: string; a: string }> | null,
    hospitals,
    relatedPosts,
  };

  return (
    <ProcedureDetailClient
      procedure={procedure}
      locale={locale as Locale}
    />
  );
}

export async function generateStaticParams() {
  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: procedures } = await (supabase.from('procedures') as any)
    .select('slug')
    .eq('is_active', true);

  const locales = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];

  return (procedures || []).flatMap((proc: { slug: string }) =>
    locales.map((locale) => ({
      locale,
      slug: proc.slug,
    }))
  );
}
