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
// HELPERS
// =====================================================

// Category/Specialty translations (same as API route)
const CATEGORY_NAMES: Record<string, Record<string, string>> = {
  'plastic-surgery': { en: 'Plastic Surgery', ko: '성형외과', ja: '美容整形', 'zh-TW': '整形外科', 'zh-CN': '整形外科', th: 'ศัลยกรรมตกแต่ง', ru: 'Пластическая хирургия', mn: 'Гоо сайхны мэс засал' },
  'dermatology': { en: 'Dermatology', ko: '피부과', ja: '皮膚科', 'zh-TW': '皮膚科', 'zh-CN': '皮肤科', th: 'ผิวหนัง', ru: 'Дерматология', mn: 'Арьс судлал' },
  'dental': { en: 'Dental', ko: '치과', ja: '歯科', 'zh-TW': '牙科', 'zh-CN': '牙科', th: 'ทันตกรรม', ru: 'Стоматология', mn: 'Шүдний эмнэлэг' },
  'ophthalmology': { en: 'Ophthalmology', ko: '안과', ja: '眼科', 'zh-TW': '眼科', 'zh-CN': '眼科', th: 'จักษุ', ru: 'Офтальмология', mn: 'Нүдний эмч' },
  'orthopedics': { en: 'Orthopedics', ko: '정형외과', ja: '整形外科', 'zh-TW': '骨科', 'zh-CN': '骨科', th: 'กระดูก', ru: 'Ортопедия', mn: 'Ортопед' },
  'health-checkup': { en: 'Health Checkup', ko: '건강검진', ja: '健康診断', 'zh-TW': '健康檢查', 'zh-CN': '健康检查', th: 'ตรวจสุขภาพ', ru: 'Медосмотр', mn: 'Эрүүл мэндийн үзлэг' },
  'cardiology': { en: 'Cardiology', ko: '심장내과', ja: '循環器科', 'zh-TW': '心臟科', 'zh-CN': '心脏科', th: 'หัวใจ', ru: 'Кардиология', mn: 'Зүрхний эмч' },
  'neurology': { en: 'Neurology', ko: '신경과', ja: '神経科', 'zh-TW': '神經科', 'zh-CN': '神经科', th: 'ประสาท', ru: 'Неврология', mn: 'Мэдрэлийн эмч' },
  'oncology': { en: 'Oncology', ko: '종양내과', ja: '腫瘍科', 'zh-TW': '腫瘤科', 'zh-CN': '肿瘤科', th: 'มะเร็ง', ru: 'Онкология', mn: 'Хавдар судлал' },
  'fertility': { en: 'Fertility', ko: '난임/불임', ja: '不妊治療', 'zh-TW': '生殖醫學', 'zh-CN': '生殖医学', th: 'ภาวะมีบุตรยาก', ru: 'Репродуктология', mn: 'Үргүйдэл' },
  'hair-transplant': { en: 'Hair Transplant', ko: '모발이식', ja: '植毛', 'zh-TW': '植髮', 'zh-CN': '植发', th: 'ปลูกผม', ru: 'Пересадка волос', mn: 'Үс шилжүүлэн суулгах' },
  'general': { en: 'General', ko: '일반', ja: '一般', 'zh-TW': '一般', 'zh-CN': '一般', th: 'ทั่วไป', ru: 'Общее', mn: 'Ерөнхий' },
};

// Language code to localized name mapping
const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  ko: { en: 'Korean', ko: '한국어', ja: '韓国語', 'zh-TW': '韓語', 'zh-CN': '韩语', th: 'เกาหลี', ru: 'Корейский', mn: 'Солонгос' },
  en: { en: 'English', ko: '영어', ja: '英語', 'zh-TW': '英語', 'zh-CN': '英语', th: 'อังกฤษ', ru: 'Английский', mn: 'Англи' },
  ja: { en: 'Japanese', ko: '일본어', ja: '日本語', 'zh-TW': '日語', 'zh-CN': '日语', th: 'ญี่ปุ่น', ru: 'Японский', mn: 'Япон' },
  'zh-TW': { en: 'Chinese (Traditional)', ko: '중국어(번체)', ja: '中国語(繁体)', 'zh-TW': '中文(繁體)', 'zh-CN': '中文(繁体)', th: 'จีน(ตัวเต็ม)', ru: 'Китайский (традиционный)', mn: 'Хятад (уламжлалт)' },
  'zh-CN': { en: 'Chinese (Simplified)', ko: '중국어(간체)', ja: '中国語(簡体)', 'zh-TW': '中文(簡體)', 'zh-CN': '中文(简体)', th: 'จีน(ตัวย่อ)', ru: 'Китайский (упрощенный)', mn: 'Хятад (хялбаршуулсан)' },
  zh: { en: 'Chinese', ko: '중국어', ja: '中国語', 'zh-TW': '中文', 'zh-CN': '中文', th: 'จีน', ru: 'Китайский', mn: 'Хятад' },
  th: { en: 'Thai', ko: '태국어', ja: 'タイ語', 'zh-TW': '泰語', 'zh-CN': '泰语', th: 'ไทย', ru: 'Тайский', mn: 'Тайланд' },
  ru: { en: 'Russian', ko: '러시아어', ja: 'ロシア語', 'zh-TW': '俄語', 'zh-CN': '俄语', th: 'รัสเซีย', ru: 'Русский', mn: 'Орос' },
  mn: { en: 'Mongolian', ko: '몽골어', ja: 'モンゴル語', 'zh-TW': '蒙古語', 'zh-CN': '蒙古语', th: 'มองโกเลีย', ru: 'Монгольский', mn: 'Монгол' },
};

function getCategoryName(code: string, targetLocale: string): string {
  const names = CATEGORY_NAMES[code];
  if (!names) return code;
  return names[targetLocale] || names['en'] || code;
}

function getLanguageName(code: string, targetLocale: string): string {
  const langNames = LANGUAGE_NAMES[code];
  if (!langNames) return code;
  return langNames[targetLocale] || langNames['en'] || code;
}

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
