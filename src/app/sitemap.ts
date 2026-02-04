import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { locales } from '@/lib/i18n/config';

// IMPORTANT: Always use production URL for sitemap (Google Search Console requirement)
const baseUrl = 'https://getcarekorea.com';

// Sitemap sections
const SITEMAP_SECTIONS = ['pages', 'hospitals', 'blog', 'interpreters', 'procedures'] as const;
type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

// Generate multiple sitemaps - creates sitemap index automatically
export async function generateSitemaps() {
  return SITEMAP_SECTIONS.map((id) => ({ id }));
}

// Generate sitemap for each section
export default async function sitemap({ id }: { id: SitemapSection }): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  switch (id) {
    case 'pages':
      return generatePagesSitemap();
    case 'hospitals':
      return generateHospitalsSitemap(supabase);
    case 'blog':
      return generateBlogSitemap(supabase);
    case 'interpreters':
      return generateInterpretersSitemap(supabase);
    case 'procedures':
      return generateProceduresSitemap(supabase);
    default:
      return [];
  }
}

// Static pages sitemap
function generatePagesSitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: 'hospitals', priority: 0.9, changeFrequency: 'daily' as const },
    { path: 'procedures', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: 'interpreters', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: 'blog', priority: 0.8, changeFrequency: 'daily' as const },
    { path: 'about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: 'faq', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: 'inquiry', priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  const urls: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    for (const locale of locales) {
      urls.push({
        url: page.path ? `${baseUrl}/${locale}/${page.path}` : `${baseUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  return urls;
}

// Hospitals sitemap
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateHospitalsSitemap(supabase: any): Promise<MetadataRoute.Sitemap> {
  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('review_count', { ascending: false });

  if (!hospitals) return [];

  const urls: MetadataRoute.Sitemap = [];

  for (const hospital of hospitals) {
    for (const locale of locales) {
      urls.push({
        url: `${baseUrl}/${locale}/hospitals/${hospital.slug}`,
        lastModified: hospital.updated_at ? new Date(hospital.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  return urls;
}

// Blog sitemap
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateBlogSitemap(supabase: any): Promise<MetadataRoute.Sitemap> {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, locale, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (!posts) return [];

  const urls: MetadataRoute.Sitemap = [];

  for (const post of posts) {
    urls.push({
      url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(post.published_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  return urls;
}

// Interpreters sitemap (from author_personas table)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateInterpretersSitemap(supabase: any): Promise<MetadataRoute.Sitemap> {
  const { data: interpreters } = await supabase
    .from('author_personas')
    .select('id, slug, updated_at')
    .eq('is_active', true)
    .order('review_count', { ascending: false });

  if (!interpreters) return [];

  const urls: MetadataRoute.Sitemap = [];

  for (const interpreter of interpreters) {
    const interpreterId = interpreter.slug || interpreter.id;
    for (const locale of locales) {
      urls.push({
        url: `${baseUrl}/${locale}/interpreters/${interpreterId}`,
        lastModified: interpreter.updated_at ? new Date(interpreter.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return urls;
}

// Procedures sitemap
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateProceduresSitemap(supabase: any): Promise<MetadataRoute.Sitemap> {
  const { data: procedures } = await supabase
    .from('procedures')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('name_en', { ascending: true });

  if (!procedures) return [];

  const urls: MetadataRoute.Sitemap = [];

  for (const procedure of procedures) {
    for (const locale of locales) {
      urls.push({
        url: `${baseUrl}/${locale}/procedures/${procedure.slug}`,
        lastModified: procedure.updated_at ? new Date(procedure.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  return urls;
}
