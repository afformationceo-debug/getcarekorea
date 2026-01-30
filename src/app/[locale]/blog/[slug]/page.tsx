import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import BlogPostClient, { type BlogPost } from './BlogPostClient';
import { locales, type Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

interface PageProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

// =====================================================
// DATA FETCHING (Simplified Schema)
// =====================================================

async function getBlogPost(slug: string, locale: Locale): Promise<BlogPost | null> {
  try {
    const supabase = await createAdminClient();

    // Fetch blog post (simplified schema: single title/content/excerpt with locale field)
    // Only fetch posts that match the current locale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
      .select(`
        id, slug, locale, title, excerpt, content,
        category, tags, cover_image_url, status,
        published_at, view_count, author_persona_id,
        seo_meta, generation_metadata
      `)
      .eq('slug', slug)
      .eq('locale', locale)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      return null;
    }

    // Fetch author persona if exists
    let authorPersona = null;
    if (post.author_persona_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: persona } = await (supabase.from('author_personas') as any)
        .select('*')
        .eq('id', post.author_persona_id)
        .single();

      if (persona) {
        // Transform JSONB fields to match client interface
        const nameObj = persona.name || {};
        const bioShortObj = persona.bio_short || {};

        authorPersona = {
          ...persona,
          // Map JSONB name to individual locale fields
          name_en: nameObj.en || nameObj.ko || persona.slug,
          name_ko: nameObj.ko || nameObj.en || persona.slug,
          name_ja: nameObj.ja || nameObj.en || null,
          name_zh_tw: nameObj['zh-TW'] || nameObj.zh || null,
          name_zh_cn: nameObj['zh-CN'] || nameObj.zh || null,
          name_th: nameObj.th || null,
          name_mn: nameObj.mn || null,
          name_ru: nameObj.ru || null,
          // Map JSONB bio_short to individual locale fields
          bio_short_en: bioShortObj.en || bioShortObj.ko || null,
          bio_short_ko: bioShortObj.ko || bioShortObj.en || null,
          bio_full_en: persona.bio_full?.en || persona.bio_full?.ko || null,
        };
      }
    }

    // Fetch related posts (same locale and category)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: relatedPosts } = await (supabase.from('blog_posts') as any)
      .select('id, slug, title, cover_image_url, published_at, locale')
      .eq('status', 'published')
      .eq('category', post.category || '')
      .eq('locale', post.locale) // Same locale
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(3);

    // Extract metadata from generation_metadata
    const metadata = post.generation_metadata || {};
    const seoMeta = post.seo_meta || {};

    return {
      id: post.id,
      slug: post.slug,
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt,
      metaTitle: seoMeta.meta_title || post.title,
      metaDescription: seoMeta.meta_description || post.excerpt,
      cover_image_url: post.cover_image_url,
      category: post.category || 'General',
      tags: post.tags,
      published_at: post.published_at,
      view_count: post.view_count || 0,
      aiSummary: metadata.aiSummary,
      faqSchema: metadata.faqSchema,
      authorPersona: authorPersona,
      generatedAuthor: metadata.author,
      relatedPosts: relatedPosts?.map((rp: { id: string; slug: string; title: string; cover_image_url: string | null; published_at: string | null }) => ({
        id: rp.id,
        slug: rp.slug,
        title: rp.title || '',
        cover_image_url: rp.cover_image_url,
        published_at: rp.published_at,
      })) || [],
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// =====================================================
// METADATA FETCHING (separate from main post fetch)
// =====================================================

async function getPostMetadata(slug: string, locale: Locale) {
  try {
    const supabase = await createAdminClient();

    // Fetch only metadata fields (no status filter for SEO purposes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
      .select('id, slug, locale, title, excerpt, cover_image_url, category, tags, published_at, seo_meta')
      .eq('slug', slug)
      .eq('locale', locale)
      .single();

    if (error || !post) {
      return null;
    }

    const seoMeta = post.seo_meta || {};

    return {
      title: post.title,
      excerpt: post.excerpt,
      metaTitle: seoMeta.meta_title || post.title,
      metaDescription: seoMeta.meta_description || post.excerpt,
      cover_image_url: post.cover_image_url,
      category: post.category,
      tags: post.tags,
      published_at: post.published_at,
    };
  } catch (error) {
    console.error('Error fetching post metadata:', error);
    return null;
  }
}

// =====================================================
// METADATA GENERATION (SEO)
// =====================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostMetadata(slug, locale);

  if (!post) {
    return {
      title: 'Post Not Found | GetCareKorea',
      description: 'The requested blog post could not be found.',
    };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || `Read about ${post.title} on GetCareKorea`;
  const imageUrl = post.cover_image_url || 'https://getcarekorea.com/og-image.jpg';

  // Base URL - use environment variable or default
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getcarekorea.com';
  const canonicalUrl = `${baseUrl}/${locale}/blog/${slug}`;

  // Generate alternate language URLs
  const alternateLanguages: Record<string, string> = {};
  for (const loc of locales) {
    alternateLanguages[loc] = `${baseUrl}/${loc}/blog/${slug}`;
  }

  return {
    title: `${title} | GetCareKorea`,
    description,
    keywords: post.tags?.join(', '),
    authors: [{ name: 'GetCareKorea Medical Team' }],
    creator: 'GetCareKorea',
    publisher: 'GetCareKorea',

    // Open Graph
    openGraph: {
      type: 'article',
      locale: locale,
      url: canonicalUrl,
      title,
      description,
      siteName: 'GetCareKorea',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime: post.published_at || undefined,
      tags: post.tags || undefined,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@getcarekorea',
    },

    // Canonical & Alternates
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Additional meta
    category: post.category,
  };
}

// =====================================================
// JSON-LD STRUCTURED DATA
// =====================================================

function generateJsonLd(post: BlogPost, locale: Locale, slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getcarekorea.com';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.metaDescription,
    image: post.cover_image_url,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: {
      '@type': 'Organization',
      name: 'GetCareKorea',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GetCareKorea',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/${locale}/blog/${slug}`,
    },
    keywords: post.tags?.join(', '),
  };

  // Medical Web Page schema
  const medicalPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: post.title,
    description: post.excerpt || post.metaDescription,
    url: `${baseUrl}/${locale}/blog/${slug}`,
    inLanguage: locale,
    specialty: post.category,
    audience: {
      '@type': 'MedicalAudience',
      audienceType: 'Patient',
    },
  };

  // FAQ Schema if available
  let faqSchema = null;
  if (post.faqSchema && post.faqSchema.length > 0) {
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqSchema.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/${locale}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${baseUrl}/${locale}/blog/${slug}`,
      },
    ],
  };

  return { articleSchema, medicalPageSchema, faqSchema, breadcrumbSchema };
}

// =====================================================
// PAGE COMPONENT
// =====================================================

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const post = await getBlogPost(slug, locale);

  // Generate JSON-LD
  const jsonLd = post ? generateJsonLd(post, locale, slug) : null;

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd.articleSchema),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd.medicalPageSchema),
            }}
          />
          {jsonLd.faqSchema && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd.faqSchema),
              }}
            />
          )}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd.breadcrumbSchema),
            }}
          />
        </>
      )}

      {/* Client Component */}
      <BlogPostClient initialPost={post} slug={slug} />
    </>
  );
}

// =====================================================
// STATIC PARAMS (Optional - for SSG)
// =====================================================

export async function generateStaticParams() {
  try {
    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: posts } = await (supabase.from('blog_posts') as any)
      .select('slug')
      .eq('status', 'published')
      .limit(100);

    if (!posts) return [];

    // Generate params for each locale
    const params: Array<{ locale: Locale; slug: string }> = [];

    for (const locale of locales) {
      for (const post of posts as Array<{ slug: string }>) {
        params.push({
          locale,
          slug: post.slug,
        });
      }
    }

    return params;
  } catch {
    return [];
  }
}
