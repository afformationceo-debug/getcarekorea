import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import BlogPostClient, { type BlogPost } from './BlogPostClient';
import { locales, type Locale } from '@/lib/i18n/config';
import { getCategoryName, getLanguageName } from '@/lib/i18n/translations';

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
// HELPERS
// =====================================================

/**
 * Safely parse JSONB field that might be string or object
 */
function safeParseJson(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === 'object') return data as Record<string, unknown>;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Sanitize data for safe JSON serialization (removes undefined, functions, circular refs)
 */
function sanitizeForJson<T>(data: T): T {
  try {
    // Round-trip through JSON to remove non-serializable values
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
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
        // Transform JSONB fields to match client interface (simplified)
        const nameObj = safeParseJson(persona.name);
        const bioShortObj = safeParseJson(persona.bio_short);

        // Convert language codes to localized display names
        const languages = Array.isArray(persona.languages)
          ? persona.languages.map((lang: { code: string; proficiency: string }) => ({
              code: lang.code,
              displayName: getLanguageName(lang.code, locale),
              proficiency: lang.proficiency,
            }))
          : [];

        // Convert specialty codes to localized display names
        const secondarySpecialties = Array.isArray(persona.secondary_specialties)
          ? persona.secondary_specialties.map((spec: string) => ({
              code: spec,
              displayName: getCategoryName(spec, locale),
            }))
          : [];

        authorPersona = {
          id: persona.id,
          slug: persona.slug,
          photo_url: persona.photo_url,
          years_of_experience: persona.years_of_experience,
          primary_specialty: persona.primary_specialty,
          primarySpecialtyDisplayName: getCategoryName(persona.primary_specialty, locale),
          secondary_specialties: secondarySpecialties,
          languages,
          certifications: persona.certifications,
          is_verified: persona.is_verified,
          // JSONB fields as locale-keyed objects
          name: nameObj as Record<string, string>,
          bio_short: bioShortObj as Record<string, string>,
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

    // Safely parse JSONB fields
    const metadata = safeParseJson(post.generation_metadata);
    const seoMeta = safeParseJson(post.seo_meta);

    // Build result and sanitize for safe JSON serialization
    const categoryCode = post.category || 'general';
    const result: BlogPost = {
      id: post.id,
      slug: post.slug,
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt,
      metaTitle: (seoMeta.meta_title as string) || post.title,
      metaDescription: (seoMeta.meta_description as string) || post.excerpt,
      cover_image_url: post.cover_image_url,
      category: categoryCode,
      categoryDisplayName: getCategoryName(categoryCode, locale),
      tags: post.tags,
      published_at: post.published_at,
      view_count: post.view_count || 0,
      aiSummary: metadata.aiSummary as BlogPost['aiSummary'],
      faqSchema: metadata.faq_schema as BlogPost['faqSchema'],
      authorPersona: authorPersona,
      generatedAuthor: metadata.author as BlogPost['generatedAuthor'],
      relatedPosts: relatedPosts?.map((rp: { id: string; slug: string; title: string; cover_image_url: string | null; published_at: string | null }) => ({
        id: rp.id,
        slug: rp.slug,
        title: rp.title || '',
        cover_image_url: rp.cover_image_url,
        published_at: rp.published_at,
      })) || [],
    };

    // Sanitize to ensure JSON-safe serialization
    return sanitizeForJson(result);
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

    // Fetch metadata fields + author for SEO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
      .select('id, slug, locale, title, excerpt, content, cover_image_url, category, tags, published_at, updated_at, seo_meta, author_persona_id')
      .eq('slug', slug)
      .eq('locale', locale)
      .single();

    if (error || !post) {
      return null;
    }

    // Fetch author persona if exists
    let authorName = 'GetCareKorea Medical Team';
    let authorSlug: string | null = null;
    if (post.author_persona_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: persona } = await (supabase.from('author_personas') as any)
        .select('slug, name')
        .eq('id', post.author_persona_id)
        .single();

      if (persona?.name) {
        const nameObj = typeof persona.name === 'string' ? JSON.parse(persona.name) : persona.name;
        authorName = nameObj[locale] || nameObj['en'] || nameObj['ko'] || 'GetCareKorea Medical Team';
        authorSlug = persona.slug;
      }
    }

    const seoMeta = post.seo_meta || {};

    // Calculate word count and reading time
    const plainText = post.content?.replace(/<[^>]*>/g, '') || '';
    const wordCount = plainText.length; // For CJK, character count is more relevant
    const readingTime = Math.ceil(wordCount / 500); // ~500 chars per minute for CJK

    // Extract first image from content for OG image
    const firstImageMatch = post.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
    const firstImageUrl = firstImageMatch ? firstImageMatch[1] : null;
    const ogImage = firstImageUrl || post.cover_image_url;

    return {
      title: post.title,
      excerpt: post.excerpt,
      metaTitle: seoMeta.meta_title || post.title,
      metaDescription: seoMeta.meta_description || post.excerpt,
      cover_image_url: ogImage,
      category: post.category,
      tags: post.tags,
      published_at: post.published_at,
      updated_at: post.updated_at,
      authorName,
      authorSlug,
      wordCount,
      readingTime,
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
  const { locale, slug: rawSlug } = await params;
  // Decode URL-encoded slug (Japanese/Chinese characters may be encoded)
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostMetadata(slug, locale);

  if (!post) {
    return {
      title: 'Post Not Found | GetCareKorea',
      description: 'The requested blog post could not be found.',
    };
  }

  // Use metaTitle if available, otherwise use title
  // Don't append "| GetCareKorea" if metaTitle already has it
  const rawTitle = post.metaTitle || post.title;
  const title = rawTitle.includes('GetCareKorea') ? rawTitle : `${rawTitle} | GetCareKorea`;
  const ogTitle = rawTitle; // For OG, use clean title without site name suffix
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

  // Author URL if available
  const authorUrl = post.authorSlug ? `${baseUrl}/${locale}/interpreters/${post.authorSlug}` : undefined;

  return {
    title,
    description,
    keywords: post.tags?.join(', '),
    authors: [{ name: post.authorName, url: authorUrl }],
    creator: post.authorName,
    publisher: 'GetCareKorea',

    // Open Graph
    openGraph: {
      type: 'article',
      locale: locale,
      url: canonicalUrl,
      title: ogTitle,
      description,
      siteName: 'GetCareKorea',
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: ogTitle,
      }],
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || post.published_at || undefined,
      authors: [post.authorName],
      section: post.category || undefined,
      tags: post.tags || undefined,
    },

    // Twitter Card
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description,
      ...(imageUrl && { images: [imageUrl] }),
      creator: '@getcarekorea',
      site: '@getcarekorea',
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

    // Other metadata
    other: {
      'article:author': post.authorName,
      'article:section': post.category || '',
      'article:tag': post.tags?.join(',') || '',
      'twitter:label1': 'Reading time',
      'twitter:data1': `${post.readingTime} min read`,
      'twitter:label2': 'Written by',
      'twitter:data2': post.authorName,
    },
  };
}

// =====================================================
// JSON-LD STRUCTURED DATA
// =====================================================

function generateJsonLd(post: BlogPost, locale: Locale, slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getcarekorea.com';

  // Get author info from authorPersona
  const authorName = post.authorPersona?.name
    ? (post.authorPersona.name[locale] || post.authorPersona.name['en'] || post.authorPersona.name['ko'] || 'GetCareKorea Medical Team')
    : (post.generatedAuthor?.name || 'GetCareKorea Medical Team');

  const authorSlug = post.authorPersona?.slug;
  const authorUrl = authorSlug ? `${baseUrl}/${locale}/interpreters/${authorSlug}` : baseUrl;

  // Calculate word count for structured data
  const plainText = post.content?.replace(/<[^>]*>/g, '') || '';
  const wordCount = plainText.length;

  // Extract first image from content for structured data
  const firstImageMatch = post.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  const articleImage = firstImageMatch ? firstImageMatch[1] : (post.cover_image_url || 'https://getcarekorea.com/og-image.jpg');

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.metaDescription,
    image: {
      '@type': 'ImageObject',
      url: articleImage,
      width: 1200,
      height: 630,
    },
    datePublished: post.published_at,
    wordCount: wordCount,
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GetCareKorea',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/${locale}/blog/${slug}`,
    },
    articleSection: post.category,
    keywords: post.tags?.join(', '),
    inLanguage: locale,
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
  const { locale, slug: rawSlug } = await params;
  // Decode URL-encoded slug (Japanese/Chinese characters may be encoded)
  const slug = decodeURIComponent(rawSlug);
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
