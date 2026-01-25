import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { locales } from '@/lib/i18n/config';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getcarekorea.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const urls: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: 'hospitals', priority: 0.9, changeFrequency: 'daily' as const },
    { path: 'interpreters', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: 'blog', priority: 0.8, changeFrequency: 'daily' as const },
    { path: 'about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: 'inquiry', priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  // Add static pages for each locale
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

  // Fetch published hospitals
  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('review_count', { ascending: false });

  if (hospitals) {
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
  }

  // Fetch published blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, locale, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (posts) {
    for (const post of posts) {
      urls.push({
        url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(post.published_at),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return urls;
}
