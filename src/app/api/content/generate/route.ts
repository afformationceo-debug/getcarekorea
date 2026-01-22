/**
 * Content Generation API
 *
 * POST /api/content/generate - Generate content from keyword
 *
 * Features:
 * - SEO-optimized content generation using Claude AI
 * - Quality scoring and validation
 * - Multi-language support
 * - Automatic blog post creation
 */

// Increase max duration to 5 minutes for content generation
export const maxDuration = 300;

import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
  validateRequired,
} from '@/lib/api/error-handler';
import {
  runContentPipeline,
  translateContent,
  scoreContent,
} from '@/lib/content/generator';
import type { Locale } from '@/lib/i18n/config';

// Supported locales for translation (must match DB schema)
// Note: 'ko' is supported for generation but content is also saved to 'en' fields as fallback
const SUPPORTED_LOCALES: Locale[] = ['en', 'ko', 'zh-TW', 'zh-CN', 'ja', 'th', 'mn', 'ru'];

// DB column name mapping - some locales have different column names in DB
const DB_LOCALE_MAP: Record<string, string> = {
  'en': 'en',
  'ko': 'ko', // Will also save to 'en' as primary
  'zh-TW': 'zh_tw',
  'zh-CN': 'zh_cn',
  'ja': 'ja',
  'th': 'th',
  'mn': 'mn',
  'ru': 'ru',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient(); // Use admin client for DB operations
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // TEMPORARILY DISABLED: Admin role check
    // TODO: Re-enable after fixing profiles table

    // Parse request body
    const body = await request.json();

    // Validate required fields
    validateRequired(body, ['keyword_id'], locale);

    const { keyword_id, translate_all = false, save_to_db = false, preview_only = true } = body;

    // Get keyword from database - use adminSupabase to bypass RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: keyword, error: keywordError } = await (adminSupabase.from('content_keywords') as any)
      .select('*')
      .eq('id', keyword_id)
      .single();

    if (keywordError || !keyword) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Keyword not found', { keyword_id }, locale);
    }

    // Check if content already exists
    if (keyword.blog_post_id && !body.regenerate) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Content already exists for this keyword. Set regenerate=true to create new content.',
        { blog_post_id: keyword.blog_post_id },
        locale
      );
    }

    secureLog('info', 'Starting content generation', {
      keywordId: keyword_id,
      keyword: keyword.keyword,
      translateAll: translate_all,
      saveToDb: save_to_db,
      previewOnly: preview_only,
      generatedBy: user.id,
    });

    // Generate content
    const startTime = Date.now();
    const pipelineResult = await runContentPipeline({
      keyword: keyword.keyword,
      locale: keyword.locale as Locale || 'en',
      category: keyword.category,
      targetWordCount: 1500,
    });

    const { content, metadata, qualityScore } = pipelineResult;

    // Generate translations if requested
    type TranslationEntry = {
      locale: Locale;
      content: typeof content;
      qualityScore: typeof qualityScore;
    };

    const translations: TranslationEntry[] = [];

    if (translate_all) {
      const sourceLocale = keyword.locale as Locale || 'en';
      const targetLocales = SUPPORTED_LOCALES.filter(l => l !== sourceLocale);

      for (const targetLocale of targetLocales) {
        try {
          const translated = await translateContent(content, sourceLocale, targetLocale);
          const translatedScore = scoreContent(translated, keyword.keyword);
          translations.push({
            locale: targetLocale,
            content: translated,
            qualityScore: translatedScore,
          });
        } catch (translationError) {
          secureLog('error', 'Translation failed', {
            targetLocale,
            error: translationError instanceof Error ? translationError.message : 'Unknown error',
          });
        }
      }
    }

    // Save to database if requested and not preview only
    let blogPost = null;
    if (save_to_db && !preview_only) {
      // Generate cover image URL based on category
      const coverImageUrl = getCoverImageUrl(keyword.category || 'medical-tourism', keyword.keyword);

      // Create blog post with all translations
      const blogPostData: Record<string, unknown> = {
        slug: generateSlug(content.title),
        status: 'draft',
        author_id: user.id,
        category: keyword.category || 'medical-tourism',
        tags: content.tags,
        cover_image_url: coverImageUrl,
        generation_metadata: {
          ...metadata,
          qualityScore: qualityScore.overall,
          generatedBy: user.id,
          generatedAt: new Date().toISOString(),
          keyword: keyword.keyword,
          sourceLocale: keyword.locale || 'en',
        },
      };

      // Add primary locale content - always save to 'en' as required field
      const primaryLocale = keyword.locale || 'en';
      const dbLocale = DB_LOCALE_MAP[primaryLocale] || 'en';

      // Always save to English fields first (required by schema)
      blogPostData['title_en'] = content.title;
      blogPostData['excerpt_en'] = content.excerpt;
      blogPostData['content_en'] = content.content;
      blogPostData['meta_title_en'] = content.metaTitle;
      blogPostData['meta_description_en'] = content.metaDescription;

      // If primary locale is not English, also save to that locale's fields
      if (dbLocale !== 'en') {
        blogPostData[`title_${dbLocale}`] = content.title;
        blogPostData[`excerpt_${dbLocale}`] = content.excerpt;
        blogPostData[`content_${dbLocale}`] = content.content;
        blogPostData[`meta_title_${dbLocale}`] = content.metaTitle;
        blogPostData[`meta_description_${dbLocale}`] = content.metaDescription;
      }

      // Add translations - only to supported DB columns
      const supportedDbLocales = ['en', 'zh_tw', 'zh_cn', 'ja', 'th', 'mn', 'ru'];
      for (const translation of translations) {
        const localeKey = translation.locale.replace('-', '_').toLowerCase();
        // Only save if the locale is supported in DB schema
        if (supportedDbLocales.includes(localeKey)) {
          blogPostData[`title_${localeKey}`] = translation.content.title;
          blogPostData[`excerpt_${localeKey}`] = translation.content.excerpt;
          blogPostData[`content_${localeKey}`] = translation.content.content;
          blogPostData[`meta_title_${localeKey}`] = translation.content.metaTitle;
          blogPostData[`meta_description_${localeKey}`] = translation.content.metaDescription;
        }
      }

      // Insert blog post - use adminSupabase to bypass RLS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedPost, error: insertError } = await (adminSupabase.from('blog_posts') as any)
        .insert(blogPostData)
        .select()
        .single();

      if (insertError) {
        secureLog('error', 'Error saving blog post', { error: insertError.message });
        throw new APIError(ErrorCode.DATABASE_ERROR, 'Failed to save blog post', undefined, locale);
      }

      blogPost = insertedPost;

      // Update keyword with blog post reference - use adminSupabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminSupabase.from('content_keywords') as any)
        .update({
          blog_post_id: insertedPost.id,
          status: 'generated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', keyword_id);

      secureLog('info', 'Blog post created', {
        blogPostId: insertedPost.id,
        keywordId: keyword_id,
        slug: insertedPost.slug,
      });
    }

    const totalTime = Date.now() - startTime;

    secureLog('info', 'Content generation completed', {
      keywordId: keyword_id,
      qualityScore: qualityScore.overall,
      translationsCount: translations.length,
      totalTimeMs: totalTime,
      savedToDb: !!blogPost,
    });

    return createSuccessResponse({
      success: true,
      preview: {
        primary: {
          locale: keyword.locale || 'en',
          content,
          qualityScore,
        },
        translations: translations.map(t => ({
          locale: t.locale,
          content: t.content,
          qualityScore: t.qualityScore,
        })),
      },
      metadata: {
        ...metadata,
        totalTimeMs: totalTime,
        translationsGenerated: translations.length,
      },
      blogPost: blogPost ? {
        id: blogPost.id,
        slug: blogPost.slug,
        status: blogPost.status,
      } : null,
      message: preview_only
        ? 'Content generated successfully (preview mode)'
        : 'Content generated and saved to database',
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 60) // Limit length
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get a high-quality cover image URL based on category and keyword
 * Using Unsplash API-style URLs for consistent, professional images
 */
function getCoverImageUrl(category: string, keyword: string): string {
  // Category-specific Unsplash collection photos (curated medical/healthcare images)
  const categoryImages: Record<string, string[]> = {
    'plastic-surgery': [
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=630&fit=crop', // Modern clinic
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&h=630&fit=crop', // Surgery room
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&h=630&fit=crop', // Medical professional
      'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&h=630&fit=crop', // Cosmetic clinic
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&h=630&fit=crop', // Doctor consultation
    ],
    'dermatology': [
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=630&fit=crop', // Skincare
      'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&h=630&fit=crop', // Skin treatment
      'https://images.unsplash.com/photo-1598524374912-6b0f4c215f58?w=1200&h=630&fit=crop', // Beauty treatment
      'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=1200&h=630&fit=crop', // Skincare products
      'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=1200&h=630&fit=crop', // Facial treatment
    ],
    'dental': [
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=630&fit=crop', // Dental clinic
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&h=630&fit=crop', // Dental treatment
      'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&h=630&fit=crop', // Dentist
      'https://images.unsplash.com/photo-1445527815219-ecbfec67492e?w=1200&h=630&fit=crop', // Smile
      'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=1200&h=630&fit=crop', // Modern dental
    ],
    'health-checkup': [
      'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=630&fit=crop', // Health checkup
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=630&fit=crop', // Medical examination
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=630&fit=crop', // Hospital
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=630&fit=crop', // Medical equipment
      'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=1200&h=630&fit=crop', // Doctor patient
    ],
    'medical-tourism': [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=630&fit=crop', // Medical
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=630&fit=crop', // Modern hospital
      'https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&h=630&fit=crop', // Healthcare
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200&h=630&fit=crop', // Medical team
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&h=630&fit=crop', // Seoul cityscape
    ],
  };

  // Get images for category, fallback to medical-tourism
  const images = categoryImages[category] || categoryImages['medical-tourism'];

  // Use keyword hash to consistently select same image for same keyword
  const hash = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % images.length;

  return images[index];
}
