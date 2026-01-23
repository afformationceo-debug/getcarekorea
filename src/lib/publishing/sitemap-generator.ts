/**
 * Sitemap Generator
 *
 * 동적 사이트맵 생성
 * - 발행된 블로그 포스트 포함
 * - 로케일별 URL 생성
 * - 마지막 수정일 포함
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { locales, type Locale } from '@/lib/i18n/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// =====================================================
// TYPES
// =====================================================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: { hreflang: string; href: string }[];
}

export interface SitemapGenerationResult {
  success: boolean;
  urlCount: number;
  xml: string;
  generatedAt: string;
}

// =====================================================
// SITEMAP GENERATION
// =====================================================

/**
 * 블로그 포스트 사이트맵 생성
 */
export async function generateBlogSitemap(
  supabase: AnySupabaseClient,
  baseUrl: string
): Promise<SitemapGenerationResult> {
  const generatedAt = new Date().toISOString();

  // 발행된 포스트 조회
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug, locale, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error || !posts) {
    return {
      success: false,
      urlCount: 0,
      xml: '',
      generatedAt,
    };
  }

  // URL 목록 생성
  const urls: SitemapUrl[] = [];

  // 슬러그별 로케일 그룹화 (hreflang 대체 링크용)
  const slugLocales = new Map<string, { locale: Locale; lastmod: string }[]>();

  for (const post of posts) {
    const key = post.slug;
    if (!slugLocales.has(key)) {
      slugLocales.set(key, []);
    }
    slugLocales.get(key)!.push({
      locale: post.locale,
      lastmod: post.updated_at || post.published_at,
    });
  }

  // 각 포스트 URL 생성
  for (const post of posts) {
    const url = `${baseUrl}/${post.locale}/blog/${post.slug}`;
    const lastmod = post.updated_at || post.published_at;

    // 대체 언어 링크 생성
    const alternates = slugLocales.get(post.slug)?.map(alt => ({
      hreflang: alt.locale,
      href: `${baseUrl}/${alt.locale}/blog/${post.slug}`,
    }));

    urls.push({
      loc: url,
      lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : undefined,
      changefreq: 'weekly',
      priority: 0.8,
      alternates,
    });
  }

  // XML 생성
  const xml = generateSitemapXml(urls);

  return {
    success: true,
    urlCount: urls.length,
    xml,
    generatedAt,
  };
}

/**
 * 전체 사이트맵 생성 (정적 페이지 + 블로그)
 */
export async function generateFullSitemap(
  supabase: AnySupabaseClient,
  baseUrl: string
): Promise<SitemapGenerationResult> {
  const generatedAt = new Date().toISOString();
  const urls: SitemapUrl[] = [];

  // 정적 페이지 추가
  const staticPages = [
    { path: '', priority: 1.0 },
    { path: 'hospitals', priority: 0.9 },
    { path: 'interpreters', priority: 0.9 },
    { path: 'procedures', priority: 0.9 },
    { path: 'blog', priority: 0.9 },
    { path: 'about', priority: 0.7 },
    { path: 'contact', priority: 0.7 },
  ];

  for (const page of staticPages) {
    for (const locale of locales) {
      const url = page.path
        ? `${baseUrl}/${locale}/${page.path}`
        : `${baseUrl}/${locale}`;

      // 대체 언어 링크
      const alternates = locales.map(l => ({
        hreflang: l,
        href: page.path ? `${baseUrl}/${l}/${page.path}` : `${baseUrl}/${l}`,
      }));

      urls.push({
        loc: url,
        lastmod: generatedAt.split('T')[0],
        changefreq: 'weekly',
        priority: page.priority,
        alternates,
      });
    }
  }

  // 블로그 포스트 추가
  const blogSitemap = await generateBlogSitemap(supabase, baseUrl);
  if (blogSitemap.success) {
    // XML 파싱 대신 다시 조회
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, locale, updated_at, published_at')
      .eq('status', 'published');

    if (posts) {
      for (const post of posts) {
        urls.push({
          loc: `${baseUrl}/${post.locale}/blog/${post.slug}`,
          lastmod: (post.updated_at || post.published_at)?.split('T')[0],
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
    }
  }

  const xml = generateSitemapXml(urls);

  return {
    success: true,
    urlCount: urls.length,
    xml,
    generatedAt,
  };
}

/**
 * 사이트맵 인덱스 생성 (대규모 사이트용)
 */
export function generateSitemapIndex(
  sitemaps: { loc: string; lastmod?: string }[],
  baseUrl: string
): string {
  const entries = sitemaps
    .map(
      (sitemap) => `
  <sitemap>
    <loc>${escapeXml(sitemap.loc)}</loc>
    ${sitemap.lastmod ? `<lastmod>${sitemap.lastmod}</lastmod>` : ''}
  </sitemap>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

// =====================================================
// XML GENERATION HELPERS
// =====================================================

/**
 * 사이트맵 XML 생성
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((url) => {
      let entry = `
  <url>
    <loc>${escapeXml(url.loc)}</loc>`;

      if (url.lastmod) {
        entry += `
    <lastmod>${url.lastmod}</lastmod>`;
      }

      if (url.changefreq) {
        entry += `
    <changefreq>${url.changefreq}</changefreq>`;
      }

      if (url.priority !== undefined) {
        entry += `
    <priority>${url.priority.toFixed(1)}</priority>`;
      }

      // xhtml:link for hreflang
      if (url.alternates && url.alternates.length > 1) {
        for (const alt of url.alternates) {
          entry += `
    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}"/>`;
        }
      }

      entry += `
  </url>`;

      return entry;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;
}

/**
 * XML 특수 문자 이스케이프
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// =====================================================
// SITEMAP NOTIFICATION
// =====================================================

/**
 * 검색 엔진에 사이트맵 업데이트 알림 (ping)
 */
export async function pingSearchEngines(sitemapUrl: string): Promise<{
  google: boolean;
  bing: boolean;
}> {
  const results = {
    google: false,
    bing: false,
  };

  // Google
  try {
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const googleResponse = await fetch(googlePingUrl);
    results.google = googleResponse.ok;
  } catch (error) {
    console.error('Google ping failed:', error);
  }

  // Bing
  try {
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const bingResponse = await fetch(bingPingUrl);
    results.bing = bingResponse.ok;
  } catch (error) {
    console.error('Bing ping failed:', error);
  }

  return results;
}

// =====================================================
// SIMPLIFIED EXPORTS FOR CRON
// =====================================================

/**
 * 사이트맵 생성 (Cron Job용 간소화 버전)
 */
export async function generateSitemap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<{ urlCount: number; xml: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getcarekorea.com';

  const result = await generateFullSitemap(supabase, baseUrl);

  return {
    urlCount: result.urlCount,
    xml: result.xml,
  };
}

/**
 * Google Search Console에 사이트맵 제출
 */
export async function submitSitemapToGoogle(): Promise<{ success: boolean }> {
  const siteUrl = process.env.GSC_SITE_URL;
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  if (!siteUrl) {
    throw new Error('GSC_SITE_URL not configured');
  }

  // Google ping endpoint 사용
  const pingResult = await pingSearchEngines(sitemapUrl);

  return {
    success: pingResult.google,
  };
}
