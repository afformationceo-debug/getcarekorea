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
// DATA FETCHING
// =====================================================

// Helper to get localized field
function getLocalizedField(post: Record<string, unknown>, fieldName: string, locale: Locale): string | null {
  const localeMap: Record<Locale, string> = {
    'ko': `${fieldName}_ko`,
    'en': `${fieldName}_en`,
    'ja': `${fieldName}_ja`,
    'zh-TW': `${fieldName}_zh_tw`,
    'zh-CN': `${fieldName}_zh_cn`,
    'th': `${fieldName}_th`,
    'ru': `${fieldName}_ru`,
    'mn': `${fieldName}_mn`,
  };

  const localizedKey = localeMap[locale];
  const englishKey = `${fieldName}_en`;

  return (post[localizedKey] as string) || (post[englishKey] as string) || null;
}

async function getBlogPost(slug: string, locale: Locale): Promise<BlogPost | null> {
  try {
    const supabase = await createAdminClient();

    // Fetch blog post - select all locale columns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      return null;
    }

    // Type assertion for dynamic access
    const postData = post as Record<string, unknown>;

    // Fetch author persona if exists
    let authorPersona = null;
    if (postData.author_persona_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: persona } = await (supabase.from('author_personas') as any)
        .select('*')
        .eq('id', postData.author_persona_id)
        .single();
      authorPersona = persona;
    }

    // Fetch related posts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: relatedPosts } = await (supabase.from('blog_posts') as any)
      .select('*')
      .eq('status', 'published')
      .eq('category', postData.category || '')
      .neq('id', postData.id)
      .order('published_at', { ascending: false })
      .limit(3);

    return {
      id: postData.id as string,
      slug: postData.slug as string,
      title: getLocalizedField(postData, 'title', locale) || '',
      content: getLocalizedField(postData, 'content', locale) || '',
      excerpt: getLocalizedField(postData, 'excerpt', locale),
      metaTitle: getLocalizedField(postData, 'meta_title', locale) || getLocalizedField(postData, 'title', locale),
      metaDescription: getLocalizedField(postData, 'meta_description', locale) || getLocalizedField(postData, 'excerpt', locale),
      cover_image_url: postData.cover_image_url as string | null,
      category: (postData.category as string) || 'General',
      tags: postData.tags as string[] | null,
      published_at: postData.published_at as string | null,
      view_count: (postData.view_count as number) || 0,
      aiSummary: postData.ai_summary as BlogPost['aiSummary'],
      faqSchema: postData.faq_schema as BlogPost['faqSchema'],
      authorPersona: authorPersona,
      generatedAuthor: postData.generated_author as BlogPost['generatedAuthor'],
      relatedPosts: relatedPosts?.map((rp: Record<string, unknown>) => ({
        id: rp.id as string,
        slug: rp.slug as string,
        title: getLocalizedField(rp, 'title', locale) || '',
        cover_image_url: rp.cover_image_url as string | null,
        published_at: rp.published_at as string | null,
      })) || [],
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// =====================================================
// METADATA GENERATION (SEO)
// =====================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPost(slug, locale);

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
