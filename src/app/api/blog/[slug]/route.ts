/**
 * Blog Post Detail API
 *
 * GET /api/blog/[slug] - Get blog post by slug
 *
 * Simplified schema: single title/content/excerpt columns with locale field
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';

// Cache blog posts for 60 seconds
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

// Define simplified blog post type
interface SimplifiedBlogPost {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  cover_image_url: string | null;
  status: string;
  published_at: string | null;
  view_count: number;
  author_persona_id: string | null;
  seo_meta: {
    meta_title?: string;
    meta_description?: string;
  } | null;
  generation_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const locale = searchParams.get('locale') || 'en';
    const includeRelated = searchParams.get('includeRelated') !== 'false';

    const startTime = Date.now();

    // Get blog post (simplified schema)
    // Filter by slug, locale, and published status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
      .select(`
        id, slug, locale, title, excerpt, content,
        category, tags, cover_image_url, status,
        published_at, view_count, author_persona_id,
        seo_meta, generation_metadata, created_at, updated_at
      `)
      .eq('slug', slug)
      .eq('locale', locale)
      .eq('status', 'published')
      .single() as { data: SimplifiedBlogPost | null; error: unknown };

    if (error || !post) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Blog post not found', { slug }, locale);
    }

    // Increment view count (fire and forget)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('blog_posts') as any)
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id)
      .then(() => {
        // View count updated
      });

    // Build response
    const response: Record<string, unknown> = {
      ...post,
      // Extract meta from seo_meta JSONB
      metaTitle: post.seo_meta?.meta_title || post.title,
      metaDescription: post.seo_meta?.meta_description || post.excerpt,
      // Map cover_image_url to featured_image for frontend compatibility
      featured_image: post.cover_image_url,
    };

    // Fetch related posts if requested (same locale and category)
    if (includeRelated && post.category) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: related } = await (supabase.from('blog_posts') as any)
        .select('id, slug, title, cover_image_url, published_at, locale')
        .eq('status', 'published')
        .eq('category', post.category)
        .eq('locale', post.locale) // Same locale
        .neq('id', post.id)
        .order('published_at', { ascending: false })
        .limit(3);

      response.relatedPosts = related || [];
    }

    // Fetch author info from author_personas
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

        response.authorPersona = {
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

        // Also set legacy author for backward compatibility
        response.author = {
          id: persona.id,
          full_name: nameObj.en || nameObj.ko || persona.slug,
          avatar_url: persona.photo_url,
        };
      }
    }

    // Extract AI summary and author info from generation_metadata
    if (post.generation_metadata) {
      const metadata = typeof post.generation_metadata === 'string'
        ? JSON.parse(post.generation_metadata)
        : post.generation_metadata;

      // Include AI summary for AEO display
      if (metadata.aiSummary) {
        response.aiSummary = metadata.aiSummary;
      }

      // Include FAQ schema if available
      if (metadata.faqSchema) {
        response.faqSchema = metadata.faqSchema;
      }

      // Include howTo schema if available
      if (metadata.howToSchema) {
        response.howToSchema = metadata.howToSchema;
      }

      // Fallback author info for AI-generated content
      if (!response.authorPersona && metadata.author) {
        response.generatedAuthor = metadata.author;
      }
    }

    const responseTime = Date.now() - startTime;
    secureLog('info', 'Blog post fetched', {
      slug,
      locale: post.locale,
      responseTimeMs: responseTime,
      viewCount: post.view_count,
    });

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}
